"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import {
  composeInstructionFromLaw,
  createGenomeVisualProfile,
  renderFormGraphSvg,
  renderGenomeGlyphSvg,
  renderPitchLatticeSvg,
  renderRhythmOrbitSvg,
  renderSpectralSurfaceSvg,
  resolveExperiment,
  type ExperimentLaw,
} from "@genusns/genome-visuals";
import { publicTraceRightsLabels } from "@genusns/rights";
import { TRACK_PACKAGE_CONTENTS } from "@/lib/commerce";
import { PlaybackProvider, usePlayback } from "@/lib/playback";
import styles from "./specimen.module.css";

export type ExperimentMode = "listen" | "law" | "trace";

const TRACE_RIGHTS = publicTraceRightsLabels();

function formatTime(sec: number): string {
  const s = Math.max(0, sec);
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, "0")}`;
}

function SpecimenBody({
  experiment,
  initialMode,
}: {
  experiment: ExperimentLaw;
  initialMode: ExperimentMode;
}) {
  const [mode, setMode] = useState<ExperimentMode>(initialMode);
  const [dataMode, setDataMode] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [pubStatus, setPubStatus] = useState<{
    published: boolean;
    inBacklog: boolean;
    hasMaster: boolean;
  } | null>(null);
  const playback = usePlayback();

  const profile = useMemo(
    () => (experiment ? createGenomeVisualProfile(experiment) : null),
    [experiment],
  );

  useEffect(() => {
    if (!experiment) return;
    const short = experiment.digest.slice(0, 6);
    let cancelled = false;
    void fetch(`/api/track-status/${short}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(
        (d: {
          published?: boolean;
          inBacklog?: boolean;
          hasMaster?: boolean;
        } | null) => {
          if (cancelled || !d) return;
          setPubStatus({
            published: Boolean(d.published),
            inBacklog: Boolean(d.inBacklog),
            hasMaster: Boolean(d.hasMaster),
          });
        },
      )
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [experiment]);

  const onKey = useCallback(
    (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "d" || e.key === "D") setDataMode((v) => !v);
      if (e.key === " ") {
        e.preventDefault();
        playback.toggle();
      }
      if (e.key === "Escape") setShowRaw(false);
    },
    [playback],
  );

  useEffect(() => {
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onKey]);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("mode", mode);
    window.history.replaceState({}, "", url.toString());
  }, [mode]);

  if (!experiment || !profile) {
    return (
      <main className={styles.missing}>
        <p className="mono">SPECIES NOT FOUND</p>
        <p>The requested identifier does not exist in the registry.</p>
        <Link href="/registry">ENTER REGISTRY</Link>
      </main>
    );
  }

  const glyph = renderGenomeGlyphSvg(profile, {
    size: 420,
    animate: mode === "listen" && !playback.playing,
    title: profile.canonicalId,
  });

  const orbit = renderRhythmOrbitSvg(profile, {
    size: mode === "listen" ? 300 : 260,
    activeStep: playback.playing ? playback.activeStep : null,
    stepPhase: playback.playing ? playback.stepPhase : 0,
  });

  return (
    <main
      className={styles.specimen}
      data-mode={mode}
      data-playing={playback.playing ? "yes" : "no"}
      data-data={dataMode ? "on" : "off"}
      style={
        {
          "--gns-accent": profile.palette.primaryAccent,
          "--gns-accent-2": profile.palette.secondaryAccent,
          "--gns-accent-muted": profile.palette.mutedAccent,
        } as CSSProperties
      }
    >
      <header className={styles.top}>
        <Link href="/" className={`${styles.brand} mono`}>
          GENUS//NS
        </Link>
        <Link href="/catalogue" className={`${styles.brand} mono`}>
          CATALOGUE
        </Link>
        <p className={`${styles.id} mono`}>{profile.canonicalId}</p>
        <nav className={styles.modes} aria-label="Experiment modes">
          {(["listen", "law", "trace"] as const).map((m) => (
            <button
              key={m}
              type="button"
              className={mode === m ? styles.modeOn : styles.mode}
              onClick={() => setMode(m)}
            >
              {m.toUpperCase()}
            </button>
          ))}
        </nav>
      </header>

      <section className={styles.hero} aria-label="Living genome">
        <div
          className={styles.glyph}
          data-pulse={playback.playing ? "on" : "off"}
          dangerouslySetInnerHTML={{ __html: glyph }}
        />
        {mode === "listen" && (
          <div className={styles.listenMeta}>
            <p className={styles.name}>{experiment.name}</p>
            <p className={`${styles.lawline} mono`}>
              {experiment.edo}-EDO · CYCLE {experiment.cycleLength} · EUCLID{" "}
              {experiment.euclidean[0]}/{experiment.euclidean[1]} ·{" "}
              {experiment.bpm} BPM
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className={styles.cover}
              src={`/api/cover/${experiment.digest.slice(0, 6)}`}
              alt={`${experiment.digest.slice(0, 6).toUpperCase()} — GENUS//NS — 0dB_Labs`}
              width={320}
              height={320}
              onError={(ev) => {
                ev.currentTarget.style.display = "none";
              }}
            />
            <div
              className={styles.orbitLive}
              dangerouslySetInnerHTML={{ __html: orbit }}
            />
            <button
              type="button"
              className={styles.play}
              onClick={playback.toggle}
              disabled={playback.mode !== "master"}
            >
              {playback.mode !== "master"
                ? pubStatus?.inBacklog || pubStatus?.hasMaster
                  ? "IN BACKLOG · ONE TRACK / DAY"
                  : "AWAITING GENUS MASTER"
                : playback.playing
                  ? "PAUSE"
                  : "PLAY"}{" "}
              {profile.canonicalId.replace("GENUS//NS:", "")}
            </button>
            <div className={`${styles.transport} mono`}>
              <span>{formatTime(playback.currentTime)}</span>
              <input
                type="range"
                min={0}
                max={playback.duration}
                step={0.05}
                value={playback.currentTime}
                onChange={(e) => playback.seek(Number(e.target.value))}
                aria-label="Seek"
                disabled={playback.mode !== "master"}
              />
              <span>{formatTime(playback.duration)}</span>
            </div>
            <p className={`${styles.note} mono`}>
              {playback.mode === "master"
                ? "GENUS MASTER · GENERATED FROM LAW PROMPT · NO AUTOPLAY"
                : pubStatus?.inBacklog || pubStatus?.hasMaster
                  ? "PACKAGE READY · AWAITING DAILY PUBLICATION SLOT"
                  : "NO PREVIEW TRACK · OPEN {} FOR COMPOSE INSTRUCTION · PUBLISH MASTER FROM GENUS"}
            </p>
            <div className={styles.packageBox}>
              <p className={`${styles.packageTitle} mono`}>
                ONE PRICE · FULL PACKAGE INCLUDES
              </p>
              <ul className={styles.packageList}>
                {TRACK_PACKAGE_CONTENTS.map((item) => (
                  <li key={item.id}>
                    <span className={`${styles.packageLabel} mono`}>{item.label}</span>
                    <span className={styles.packageDetail}>{item.detail}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className={styles.play}
                disabled={playback.mode !== "master"}
                onClick={() => {
                  void fetch("/api/checkout", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      kind: "track",
                      trackId: experiment.digest.slice(0, 6),
                    }),
                  })
                    .then((r) => r.json())
                    .then((d: { url?: string }) => {
                      if (d.url) window.location.href = d.url;
                    });
                }}
              >
                {playback.mode === "master"
                  ? "BUY FULL PACKAGE"
                  : pubStatus?.inBacklog || pubStatus?.hasMaster
                    ? "NOT YET PUBLISHED"
                    : "BUY FULL PACKAGE"}
              </button>
            </div>
          </div>
        )}
      </section>

      {mode === "law" && (
        <section className={styles.panels}>
          <div className={styles.zone}>
            <h2 className="mono">THE LAW</h2>
            <dl className={`${styles.spec} mono`}>
              <div>
                <dt>EDO</dt>
                <dd>{experiment.edo}</dd>
              </div>
              <div>
                <dt>CYCLE</dt>
                <dd>Z/{experiment.cycleLength}Z</dd>
              </div>
              <div>
                <dt>EUCLID</dt>
                <dd>
                  {experiment.euclidean[0]}/{experiment.euclidean[1]}
                </dd>
              </div>
              <div>
                <dt>ACCENTS</dt>
                <dd>{experiment.accentResidues.join(", ")}</dd>
              </div>
              <div>
                <dt>EVENTS</dt>
                <dd>{experiment.eventCount}</dd>
              </div>
              <div>
                <dt>DIGEST</dt>
                <dd>{experiment.digest}</dd>
              </div>
            </dl>
            <div dangerouslySetInnerHTML={{ __html: orbit }} />
          </div>
          <div className={styles.zone}>
            <h2 className="mono">PITCH</h2>
            <div
              dangerouslySetInnerHTML={{
                __html: renderPitchLatticeSvg(profile, { size: 280 }),
              }}
            />
          </div>
          <div className={styles.zone}>
            <h2 className="mono">FORM</h2>
            <div
              dangerouslySetInnerHTML={{
                __html: renderFormGraphSvg(profile, { width: 340, height: 200 }),
              }}
            />
            <p className={`${styles.path} mono`}>
              {experiment.formPath.join(" → ")}
            </p>
          </div>
          <div className={styles.zoneWide}>
            <h2 className="mono">SPECTRAL SURFACE</h2>
            <div
              dangerouslySetInnerHTML={{
                __html: renderSpectralSurfaceSvg(profile, {
                  width: 720,
                  height: 100,
                }),
              }}
            />
            <p className={`${styles.caveat} mono`}>
              Visual mapping of centroid / inharmonicity / roughness — not a
              scientific claim.
            </p>
          </div>
        </section>
      )}

      {mode === "trace" && (
        <section className={styles.trace}>
          <h2 className="mono">THE TRACE</h2>
          <ol className={styles.timeline}>
            <li>
              <span className="mono">GENOME APPROVED</span>
              <span>
                Genre Genesis board
                {experiment.nearestKnown
                  ? ` · nearest ${experiment.nearestKnown}`
                  : ""}
              </span>
            </li>
            <li>
              <span className="mono">GENOME COMPILED</span>
              <span>
                Pack artefacts · {experiment.eventCount} formal events
              </span>
            </li>
            <li>
              <span className="mono">REALISATION</span>
              <span>
                Compose candidates · operator selection (when supplied)
              </span>
            </li>
            <li>
              <span className="mono">REFINEMENT</span>
              <span>
                Performance layer only · named DSP (when supplied) · does not
                create a composer claim
              </span>
            </li>
            <li>
              <span className="mono">SENT TO GENUS//NS</span>
              <span>
                Publication snapshot · hash-verified registry record
              </span>
            </li>
          </ol>

          <div className={styles.rightsBlock}>
            <h2 className="mono">MACHINE</h2>
            <ul>
              {TRACE_RIGHTS.machine.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <h2 className="mono">HUMAN</h2>
            <ul>
              {TRACE_RIGHTS.human.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <h2 className="mono">COMPOSITION ROYALTIES</h2>
            <p>{TRACE_RIGHTS.compositionRoyalties}</p>
            <p className={styles.caveat}>
              Machine-generated composition. Publishing royalties not claimed.
              Master recording commercially distributed.
            </p>
            <h2 className="mono">MASTER</h2>
            <p>
              {TRACE_RIGHTS.master} · master-side revenue collected
            </p>
          </div>

          <p className={styles.caveat}>
            Machines invent and measure. Humans operate, select, and publish.
            Refine does not rewrite composition. Operator selection is
            curation, not automatic authorship.
          </p>
        </section>
      )}

      {dataMode && (
        <aside className={`${styles.dataOverlay} mono`} aria-label="Data mode">
          <p>EDO = {experiment.edo}</p>
          <p>cycle = {experiment.cycleLength}</p>
          {experiment.accentResidues.map((a) => (
            <p key={a}>accent = {a}</p>
          ))}
          <p>euclid = {profile.euclideanHits.join(",")}</p>
          <p>step = {playback.activeStep}</p>
          <p>progress = {(playback.progress * 100).toFixed(1)}%</p>
          <p>inharmonicity = {experiment.spectral.inharmonicity}</p>
          <p>geometry = {profile.geometryVariant}</p>
          <p>visual = {profile.version}</p>
        </aside>
      )}

      <footer className={styles.foot}>
        <button
          type="button"
          className={`${styles.rawBtn} mono`}
          onClick={() => setShowRaw(true)}
        >
          {"{}"}
        </button>
        <span className={`${styles.hint} mono`}>D · DATA · SPACE PLAY</span>
        <Link
          href={`/compare?g=${experiment.digest.slice(0, 6)},6336b6`}
          className={`${styles.hint} mono`}
        >
          COMPARE
        </Link>
        <Link href="/registry" className={`${styles.hint} mono`}>
          REGISTRY
        </Link>
      </footer>

      {showRaw && (
        <div className={styles.raw} role="dialog" aria-modal="true">
          <header>
            <span className="mono">PUBLIC MACHINE RECORD</span>
            <button
              type="button"
              className="mono"
              onClick={() => setShowRaw(false)}
            >
              CLOSE
            </button>
          </header>
          <pre className="mono">
            {JSON.stringify(
              {
                experiment,
                compose_instruction: composeInstructionFromLaw(experiment),
                visual_profile: {
                  version: profile.version,
                  geometryVariant: profile.geometryVariant,
                  accents: profile.accents,
                  euclideanHits: profile.euclideanHits,
                  palette: profile.palette,
                },
                listen_policy:
                  "Published audio must be a Genus Compose master generated from compose_instruction (or the compiled pack foundry_brief/prompts). No Web Audio preview, Foundry demo, or raw source track.",
              },
              null,
              2,
            )}
          </pre>
        </div>
      )}
    </main>
  );
}

export function ExperimentSpecimen({
  id,
  initialMode = "listen",
  initial = null,
}: {
  id: string;
  initialMode?: ExperimentMode;
  initial?: ExperimentLaw | null;
}) {
  const bundled = initial ?? resolveExperiment(id);
  const [experiment, setExperiment] = useState(bundled);
  const [loading, setLoading] = useState(!bundled);

  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/catalog/${encodeURIComponent(id)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: typeof bundled) => {
        if (cancelled || !d?.digest) return;
        setExperiment(d);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading && !experiment) {
    return (
      <main className={styles.missing}>
        <p className="mono">LOADING SPECIES</p>
      </main>
    );
  }
  if (!experiment) {
    return (
      <main className={styles.missing}>
        <p className="mono">SPECIES NOT FOUND</p>
        <p>The requested identifier does not exist in the registry.</p>
        <Link href="/registry">ENTER REGISTRY</Link>
      </main>
    );
  }
  const profile = createGenomeVisualProfile(experiment);
  return (
    <PlaybackProvider experiment={experiment} profile={profile}>
      <SpecimenBody experiment={experiment} initialMode={initialMode} />
    </PlaybackProvider>
  );
}
