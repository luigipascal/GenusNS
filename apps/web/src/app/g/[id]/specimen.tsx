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
  createGenomeVisualProfile,
  renderFormGraphSvg,
  renderGenomeGlyphSvg,
  renderPitchLatticeSvg,
  renderRhythmOrbitSvg,
  renderSpectralSurfaceSvg,
  resolveExperiment,
} from "@genusns/genome-visuals";
import { publicTraceRightsLabels } from "@genusns/rights";
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
  id,
  initialMode,
}: {
  id: string;
  initialMode: ExperimentMode;
}) {
  const experiment = resolveExperiment(id);
  const [mode, setMode] = useState<ExperimentMode>(initialMode);
  const [dataMode, setDataMode] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const playback = usePlayback();

  const profile = useMemo(
    () => (experiment ? createGenomeVisualProfile(experiment) : null),
    [experiment],
  );

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
              src={`/covers/${experiment.digest.slice(0, 6).toLowerCase()}.png`}
              alt={`${experiment.digest.slice(0, 6).toUpperCase()} — GENUS//NS — 0dB_Labs`}
              width={320}
              height={320}
            />
            <div
              className={styles.orbitLive}
              dangerouslySetInnerHTML={{ __html: orbit }}
            />
            <button
              type="button"
              className={styles.play}
              onClick={playback.toggle}
            >
              {playback.playing ? "PAUSE" : "PLAY"}{" "}
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
              />
              <span>{formatTime(playback.duration)}</span>
            </div>
            <p className={`${styles.note} mono`}>
              {playback.mode === "master"
                ? "MASTER AUDIO · NO AUTOPLAY"
                : playback.mode === "genome-preview"
                  ? "GENOME AUDITION · WEB AUDIO PREVIEW · NO AUTOPLAY"
                  : "LOADING AUDIO…"}
            </p>
            <button
              type="button"
              className={styles.play}
              style={{ marginTop: "0.75rem" }}
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
              BUY DOWNLOAD
            </button>
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
                visual_profile: {
                  version: profile.version,
                  geometryVariant: profile.geometryVariant,
                  accents: profile.accents,
                  euclideanHits: profile.euclideanHits,
                  palette: profile.palette,
                },
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
}: {
  id: string;
  initialMode?: ExperimentMode;
}) {
  const experiment = resolveExperiment(id);
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
      <SpecimenBody id={id} initialMode={initialMode} />
    </PlaybackProvider>
  );
}
