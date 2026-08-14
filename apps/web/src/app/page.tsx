"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  createGenomeVisualProfile,
  getFeaturedExperiment,
  renderGenomeGlyphSvg,
} from "@genusns/genome-visuals";
import { NewsletterForm } from "@/components/NewsletterForm";
import styles from "./page.module.css";

export default function HomePage() {
  const experiment = getFeaturedExperiment();
  const profile = useMemo(
    () => createGenomeVisualProfile(experiment),
    [experiment],
  );
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timers = [
      window.setTimeout(() => setStage(1), 400),
      window.setTimeout(() => setStage(2), 1100),
      window.setTimeout(() => setStage(3), 1800),
      window.setTimeout(() => setStage(4), 2400),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const glyph = renderGenomeGlyphSvg(profile, {
    size: 340,
    animate: stage >= 2,
    title: profile.canonicalId,
  });

  return (
    <main
      className={styles.field}
      data-stage={stage}
      style={
        {
          "--gns-accent": profile.palette.primaryAccent,
          "--gns-accent-2": profile.palette.secondaryAccent,
          "--gns-accent-muted": profile.palette.mutedAccent,
        } as CSSProperties
      }
    >
      <p className={`${styles.mark} mono`} data-show={stage >= 1}>
        GENUS//NS
      </p>
      <p className={`${styles.imprint} mono`} data-show={stage >= 1}>
        RONDANINI PUBLISHING LTD T/A 0DB_LABS
      </p>
      <div
        className={styles.structure}
        data-show={stage >= 2}
        dangerouslySetInnerHTML={{ __html: glyph }}
      />
      <h1 className={styles.line} data-show={stage >= 3}>
        MUSIC FOR GENRES
        <br />
        THAT DO NOT EXIST YET
      </h1>
      <p className={`${styles.sub} mono`} data-show={stage >= 3}>
        A NEURAL SYNTAX EXPERIMENT
        <br />
        IN COMPUTATIONAL MUSICAL TAXONOMY
        <br />
        PUBLISHED UNDER 0DB_LABS
      </p>
      <nav className={styles.actions} data-show={stage >= 4}>
        <Link href="/catalogue" className={styles.action}>
          CATALOGUE
        </Link>
        <Link href="/registry" className={styles.action}>
          ENTER THE REGISTRY
        </Link>
        <Link href={`/g/${experiment.digest.slice(0, 6)}`} className={styles.action}>
          LISTEN
        </Link>
        <Link href="/about" className={styles.action}>
          ABOUT
        </Link>
        <Link href="/services" className={styles.action}>
          SERVICES
        </Link>
        <Link href="/method" className={styles.action}>
          METHOD
        </Link>
      </nav>
      <div className={styles.dispatch} data-show={stage >= 4}>
        <NewsletterForm idPrefix="home" variant="hero" />
      </div>
      <p className={`${styles.species} mono`} data-show={stage >= 4}>
        THE CURRENT SPECIES · {profile.canonicalId} · {profile.radialSegments}
        -EDO · CYCLE {profile.pulseCount} · EUCLID {experiment.euclidean[0]}/
        {experiment.euclidean[1]}
      </p>
    </main>
  );
}
