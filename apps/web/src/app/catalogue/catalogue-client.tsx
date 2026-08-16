"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ExperimentLaw } from "@genusns/genome-visuals";
import { LEGAL } from "@/lib/legal";
import styles from "./catalogue.module.css";

type PubStatus = {
  published: boolean;
  inBacklog: boolean;
  publishedAt: string | null;
  smartLink?: string | null;
};

type Filter = "all" | "listen" | "queue";

function shortOf(e: ExperimentLaw): string {
  return e.digest.slice(0, 6).toUpperCase();
}

function availability(s: PubStatus | undefined): Filter {
  if (s?.published) return "listen";
  return "queue";
}

function statusLabel(s: PubStatus | undefined): string {
  if (s?.published && s.smartLink) return "Listen · Platforms · Buy";
  if (s?.published) return "Listen · Buy · Platforms coming up";
  if (s?.inBacklog) return "In backlog";
  return "Awaiting master";
}

export function CatalogueClient() {
  const [experiments, setExperiments] = useState<ExperimentLaw[]>([]);
  const [status, setStatus] = useState<Record<string, PubStatus>>({});
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<"id" | "edo" | "bpm">("id");

  useEffect(() => {
    void fetch("/api/catalog")
      .then((r) => (r.ok ? r.json() : null))
      .then(
        (
          d: {
            experiments?: ExperimentLaw[];
            status?: Record<string, PubStatus>;
          } | null,
        ) => {
          if (d?.experiments?.length) setExperiments(d.experiments);
          if (d?.status) setStatus(d.status);
        },
      )
      .catch(() => undefined);
  }, []);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = experiments.filter((e) => {
      const st = status[shortOf(e)];
      if (filter !== "all" && availability(st) !== filter) return false;
      if (!q) return true;
      const blob = [
        e.digest,
        e.name,
        e.canonicalId,
        String(e.edo),
        String(e.cycleLength),
        String(e.bpm),
        e.rhythmRule ?? "",
        e.nearestKnown ?? "",
        (e.form.nodes ?? []).join(" "),
      ]
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });
    list = [...list].sort((a, b) => {
      if (sort === "edo") return a.edo - b.edo;
      if (sort === "bpm") return a.bpm - b.bpm;
      return shortOf(a).localeCompare(shortOf(b));
    });
    return list;
  }, [experiments, status, query, filter, sort]);

  const listenCount = experiments.filter(
    (e) => status[shortOf(e)]?.published,
  ).length;

  return (
    <main className={styles.page}>
      <header className={styles.top}>
        <p className={`${styles.brand} mono`}>
          <Link href="/">GENUS//NS</Link>
          <span aria-hidden="true"> / </span>
          <span>Catalogue</span>
        </p>
        <nav className={`${styles.nav} mono`}>
          <Link href="/registry">Registry map</Link>
          <Link href="/about">About</Link>
          <a href={LEGAL.forumUrl} rel="noopener noreferrer" target="_blank">
            Forum
          </a>
          <a href={LEGAL.youtubeUrl} rel="noopener noreferrer" target="_blank">
            YouTube
          </a>
        </nav>
      </header>

      <section className={styles.intro}>
        <h1>All species</h1>
        <p>
          Each box is one genome: cover grown from the law, then the numbers
          that define the music. Published tracks can be listened to and bought
          as a full package (£1.99).
        </p>
      </section>

      <div className={styles.controls}>
        <label className={styles.search}>
          <span className="mono">Search</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="id, EDO, cycle, gamelan…"
          />
        </label>
        <div className={`${styles.pills} mono`} role="group" aria-label="Filter">
          {(
            [
              ["all", `All (${experiments.length})`],
              ["listen", `Available (${listenCount})`],
              ["queue", "Not yet public"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={filter === id ? styles.on : undefined}
              onClick={() => setFilter(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <label className={`${styles.sort} mono`}>
          Sort
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
          >
            <option value="id">Id</option>
            <option value="edo">EDO</option>
            <option value="bpm">BPM</option>
          </select>
        </label>
      </div>

      {experiments.length === 0 ? (
        <p className={`${styles.empty} mono`}>Loading catalogue…</p>
      ) : rows.length === 0 ? (
        <p className={`${styles.empty} mono`}>No species match.</p>
      ) : (
        <ul className={styles.grid}>
          {rows.map((e) => {
            const id = shortOf(e);
            const st = status[id];
            const eu = e.euclidean ?? [0, 0];
            return (
              <li key={e.digest} className={styles.card}>
                <Link href={`/g/${id}`} className={styles.coverLink}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/cover/${id}`}
                    alt={`${id} cover — GENUS//NS`}
                    width={640}
                    height={640}
                    onError={(ev) => {
                      ev.currentTarget.style.display = "none";
                    }}
                  />
                  <span className={`${styles.badge} mono`}>
                    {statusLabel(st)}
                  </span>
                </Link>
                <div className={styles.body}>
                  <h2>
                    <Link href={`/g/${id}`}>{id}</Link>
                  </h2>
                  <p className={styles.name}>{e.name}</p>
                  <dl className={`${styles.spec} mono`}>
                    <div>
                      <dt>EDO</dt>
                      <dd>{e.edo}</dd>
                    </div>
                    <div>
                      <dt>Cycle</dt>
                      <dd>{e.cycleLength}</dd>
                    </div>
                    <div>
                      <dt>BPM</dt>
                      <dd>{Math.round(e.bpm)}</dd>
                    </div>
                    <div>
                      <dt>Euclid</dt>
                      <dd>
                        {eu[0]}/{eu[1]}
                      </dd>
                    </div>
                    <div>
                      <dt>Tonic</dt>
                      <dd>{Math.round(e.tonicHz)} Hz</dd>
                    </div>
                    <div>
                      <dt>Events</dt>
                      <dd>{e.eventCount}</dd>
                    </div>
                  </dl>
                  <p className={styles.rule}>
                    {e.rhythmRule ??
                      `Euclidean(${eu[0]},${eu[1]}) · ${e.edo}-EDO`}
                  </p>
                  {e.form.nodes?.length ? (
                    <p className={`${styles.form} mono`}>
                      {e.form.nodes.join(" → ")}
                    </p>
                  ) : null}
                  {e.nearestKnown ? (
                    <p className={`${styles.near} mono`}>
                      nearest known · {e.nearestKnown.replaceAll("_", " ")}
                      {typeof e.noveltyDistance === "number"
                        ? ` · Δ ${e.noveltyDistance.toFixed(3)}`
                        : ""}
                    </p>
                  ) : null}
                  <div className={styles.actions}>
                    <Link href={`/g/${id}?mode=listen`}>Open</Link>
                    {st?.published ? (
                      <Link href={`/g/${id}?mode=listen`}>Listen / Buy</Link>
                    ) : (
                      <span className={styles.muted}>Not on sale yet</span>
                    )}
                    {st?.smartLink ? (
                      <a
                        href={st.smartLink}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Platforms
                      </a>
                    ) : st?.published ? (
                      <span className={styles.muted}>Platforms coming up</span>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
