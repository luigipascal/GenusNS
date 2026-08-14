"use client";

import Link from "next/link";
import { PODCAST } from "@/lib/podcast";
import styles from "../doc.module.css";

export function PodcastClient() {
  return (
    <main className={styles.doc}>
      <header className={styles.bar}>
        <Link href="/" className="mono">
          GENUS//NS
        </Link>
      </header>

      <div className={styles.player}>
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <audio controls preload="metadata" src={PODCAST.audioSrc} />
      </div>
    </main>
  );
}
