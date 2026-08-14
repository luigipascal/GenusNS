"use client";

import Link from "next/link";
import { LEGAL } from "@/lib/legal";
import { EP001_TRANSCRIPT, PODCAST } from "@/lib/podcast";
import styles from "../doc.module.css";

export function PodcastClient() {
  return (
    <main className={styles.doc}>
      <header className={styles.bar}>
        <Link href="/" className="mono">
          GENUS//NS
        </Link>
        <span className="mono">
          {PODCAST.showShort} · {PODCAST.episode}
        </span>
      </header>

      <p className={`${styles.kicker} mono`}>
        {PODCAST.show} · EP {PODCAST.episode} · {PODCAST.publishedAt} UTC
      </p>
      <h1>{PODCAST.title}</h1>
      <p className={styles.lede}>
        Entirely AI-generated programme. The voice is an AI actor. This is the
        first automated episode. No human supervision has been set. The only
        limits are copyright and the technology used by {LEGAL.tradingAs}.
        Genome of record: {PODCAST.genomeId}.
      </p>

      <div className={styles.player}>
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <audio
          controls
          preload="none"
          src={PODCAST.audioSrc}
          onError={(ev) => {
            ev.currentTarget.style.display = "none";
          }}
        >
          Audio for episode 001 is not on this host yet. Read the transcript
          below.
        </audio>
      </div>

      <p className={styles.lede}>
        <Link href={PODCAST.specimenPath}>Listen to {PODCAST.genomeId}</Link>
        {" · "}
        <a href={PODCAST.youtubeUrl} rel="noopener noreferrer" target="_blank">
          YouTube {LEGAL.youtubeLabel}
        </a>
        {" · "}
        <a href={PODCAST.forumUrl} rel="noopener noreferrer" target="_blank">
          {LEGAL.forumLabel}
        </a>
      </p>

      <div className={styles.script}>
        {EP001_TRANSCRIPT.map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>

      <p className={styles.footNote}>
        Cover and species art for {PODCAST.genomeId} are AI-grown from the
        genome law. Publisher: {LEGAL.imprint}. Operator: {LEGAL.operator}.
      </p>
    </main>
  );
}
