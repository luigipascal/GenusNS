"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type { ExperimentLaw } from "@genusns/genome-visuals";
import {
  createGenomeVisualProfile,
  listExperiments,
  renderGenomeGlyphSvg,
} from "@genusns/genome-visuals";
import styles from "./page.module.css";

type View = "field" | "index" | "timeline";

export default function RegistryPage() {
  const [experiments, setExperiments] = useState<ExperimentLaw[]>(() =>
    listExperiments(),
  );
  const [view, setView] = useState<View>("field");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const profiles = useMemo(
    () =>
      experiments.map((e) => ({
        experiment: e,
        profile: createGenomeVisualProfile(e),
      })),
    [experiments],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter(({ experiment: e }) => {
      const blob = [
        e.digest,
        e.canonicalId,
        e.name,
        String(e.edo),
        String(e.cycleLength),
        e.nearestKnown ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });
  }, [profiles, query]);

  useEffect(() => {
    void fetch("/api/catalog")
      .then((r) => (r.ok ? r.json() : null))
      .then(
        (d: { experiments?: ExperimentLaw[] } | null) => {
          if (d?.experiments?.length) setExperiments(d.experiments);
        },
      )
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "/") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const edoMax = Math.max(...experiments.map((e) => e.edo), 1);
  const cycleMax = Math.max(...experiments.map((e) => e.cycleLength), 1);

  return (
    <main className={styles.field}>
      <header className={styles.bar}>
        <Link href="/" className="mono">
          GENUS//NS
        </Link>
        <Link href="/catalogue" className={`${styles.searchBtn} mono`}>
          CATALOGUE
        </Link>
        <nav className={`${styles.views} mono`} aria-label="Registry views">
          {(["field", "index", "timeline"] as const).map((v) => (
            <button
              key={v}
              type="button"
              className={view === v ? styles.on : undefined}
              onClick={() => setView(v)}
            >
              {v.toUpperCase()}
            </button>
          ))}
        </nav>
        <button
          type="button"
          className={`${styles.searchBtn} mono`}
          onClick={() => setSearchOpen(true)}
        >
          / SEARCH
        </button>
      </header>

      <p className={`${styles.note} mono`}>
        {view === "field"
          ? "VISUAL PARAMETER MAP · X≈EDO · Y≈CYCLE · SIZE≈EVENTS · NOT MUSICAL SIMILARITY"
          : view === "index"
            ? "INDEX · TEXTUAL ACCESS"
            : "TIMELINE · DIGEST ORDER (PROXY UNTIL PUBLICATION DATES)"}
      </p>

      {view === "field" && (
        <div className={styles.plane} role="list">
          {filtered.map(({ experiment: e, profile }) => {
            const x = (e.edo / edoMax) * 78 + 8;
            const y = 88 - (e.cycleLength / cycleMax) * 70;
            const size = 4.2 + (e.eventCount / 1200) * 3.2;
            const glyph = renderGenomeGlyphSvg(profile, {
              size: 128,
              animate: false,
            });
            return (
              <Link
                key={e.digest}
                href={`/g/${e.digest.slice(0, 6)}`}
                className={styles.species}
                style={
                  {
                    left: `${x}%`,
                    top: `${y}%`,
                    "--glyph-size": `${size}rem`,
                    "--gns-accent": profile.palette.primaryAccent,
                  } as CSSProperties
                }
                role="listitem"
                title={`${e.canonicalId} · ${e.edo}-EDO · ${e.cycleLength} · ${e.bpm}`}
              >
                <span
                  className={styles.glyph}
                  dangerouslySetInnerHTML={{ __html: glyph }}
                />
                <span className={`${styles.label} mono`}>
                  {e.digest.slice(0, 6).toUpperCase()}
                  <br />
                  {e.edo}-EDO · {e.cycleLength} · {e.bpm}
                </span>
              </Link>
            );
          })}
        </div>
      )}

      {view === "index" && (
        <ul className={styles.index}>
          {filtered.map(({ experiment: e, profile }) => (
            <li key={e.digest}>
              <Link
                href={`/g/${e.digest.slice(0, 6)}`}
                style={
                  {
                    "--gns-accent": profile.palette.primaryAccent,
                  } as CSSProperties
                }
              >
                <span className="mono">{e.canonicalId}</span>
                <span className="mono">
                  {e.edo}-EDO · Z/{e.cycleLength}Z · {e.bpm} BPM ·{" "}
                  {e.eventCount} EVENTS
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {view === "timeline" && (
        <ol className={styles.timeline}>
          {filtered.map(({ experiment: e }) => (
            <li key={e.digest}>
              <Link href={`/g/${e.digest.slice(0, 6)}`} className="mono">
                <span>{e.canonicalId}</span>
                <span>
                  {e.edo}-EDO · CYCLE {e.cycleLength}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}

      {searchOpen && (
        <div className={styles.search} role="dialog" aria-modal="true">
          <input
            autoFocus
            className="mono"
            placeholder="288 · 36 · cycle · gamelan…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setSearchOpen(false);
            }}
          />
          <p className="mono">{filtered.length} SPECIES</p>
          <button
            type="button"
            className="mono"
            onClick={() => setSearchOpen(false)}
          >
            ESC
          </button>
        </div>
      )}
    </main>
  );
}
