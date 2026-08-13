"use client";

import Link from "next/link";
import { Suspense, useMemo, useState, type CSSProperties } from "react";
import { useSearchParams } from "next/navigation";
import {
  createGenomeVisualProfile,
  interpolateVisualProfiles,
  renderGenomeGlyphSvg,
  resolveExperiment,
} from "@genusns/genome-visuals";
import styles from "./page.module.css";

function CompareInner() {
  const sp = useSearchParams();
  const raw = sp.get("g") ?? "288fbd,6336b6";
  const [left, right] = raw.split(",").map((s) => s.trim());
  const a = resolveExperiment(left || "288fbd");
  const b = resolveExperiment(right || "6336b6");
  const [t, setT] = useState(0);

  const pa = useMemo(() => (a ? createGenomeVisualProfile(a) : null), [a]);
  const pb = useMemo(() => (b ? createGenomeVisualProfile(b) : null), [b]);
  const mid = useMemo(
    () => (pa && pb ? interpolateVisualProfiles(pa, pb, t) : null),
    [pa, pb, t],
  );

  if (!a || !b || !pa || !pb || !mid) {
    return (
      <main className={styles.wrap}>
        <p className="mono">SPECIES NOT FOUND</p>
        <Link href="/registry">ENTER REGISTRY</Link>
      </main>
    );
  }

  return (
    <main
      className={styles.wrap}
      style={
        {
          "--gns-accent": mid.palette.primaryAccent,
          "--gns-accent-2": mid.palette.secondaryAccent,
        } as CSSProperties
      }
    >
      <header className={styles.bar}>
        <Link href="/" className="mono">
          GENUS//NS
        </Link>
        <span className="mono">COMPARE</span>
        <Link href="/registry" className="mono">
          REGISTRY
        </Link>
      </header>

      <div className={styles.cols}>
        <div>
          <p className={`${styles.id} mono`}>{a.canonicalId}</p>
          <div
            dangerouslySetInnerHTML={{
              __html: renderGenomeGlyphSvg(pa, { size: 180, animate: false }),
            }}
          />
          <dl className={`${styles.spec} mono`}>
            <div>
              <dt>EDO</dt>
              <dd>{a.edo}</dd>
            </div>
            <div>
              <dt>CYCLE</dt>
              <dd>{a.cycleLength}</dd>
            </div>
            <div>
              <dt>EUCLID</dt>
              <dd>
                {a.euclidean[0]}/{a.euclidean[1]}
              </dd>
            </div>
          </dl>
        </div>

        <div className={styles.mid}>
          <p className={`${styles.tag} mono`}>VISUAL INTERPOLATION</p>
          <div
            dangerouslySetInnerHTML={{
              __html: renderGenomeGlyphSvg(mid, { size: 220, animate: false }),
            }}
          />
          <label className={`${styles.slider} mono`}>
            {a.digest.slice(0, 6).toUpperCase()}
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={t}
              onChange={(e) => setT(Number(e.target.value))}
            />
            {b.digest.slice(0, 6).toUpperCase()}
          </label>
          <p className={`${styles.caveat} mono`}>
            Midpoint is not a valid musical genre — presentation only.
          </p>
        </div>

        <div>
          <p className={`${styles.id} mono`}>{b.canonicalId}</p>
          <div
            dangerouslySetInnerHTML={{
              __html: renderGenomeGlyphSvg(pb, { size: 180, animate: false }),
            }}
          />
          <dl className={`${styles.spec} mono`}>
            <div>
              <dt>EDO</dt>
              <dd>{b.edo}</dd>
            </div>
            <div>
              <dt>CYCLE</dt>
              <dd>{b.cycleLength}</dd>
            </div>
            <div>
              <dt>EUCLID</dt>
              <dd>
                {b.euclidean[0]}/{b.euclidean[1]}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </main>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<main className={styles.wrap} />}>
      <CompareInner />
    </Suspense>
  );
}
