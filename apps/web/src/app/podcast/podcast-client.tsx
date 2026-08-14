"use client";

import { useState } from "react";
import { PODCAST } from "@/lib/podcast";
import type { YoutubeEpisode } from "@/lib/youtubeEpisodes";
import styles from "./podcast.module.css";

export function PodcastClient({ episodes }: { episodes: YoutubeEpisode[] }) {
  const [active, setActive] = useState(episodes[0]?.id ?? "");
  const current = episodes.find((e) => e.id === active) ?? episodes[0];

  if (!current) {
    return (
      <main className={styles.page}>
        <div className={styles.deck}>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            className={styles.video}
            controls
            playsInline
            preload="metadata"
            src={PODCAST.mediaSrc}
          />
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.deck}>
        <iframe
          className={styles.video}
          src={`https://www.youtube-nocookie.com/embed/${current.id}?rel=0`}
          title={current.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
        {episodes.length > 1 ? (
          <ol className={styles.list}>
            {episodes.map((ep) => (
              <li key={ep.id}>
                <button
                  type="button"
                  className={styles.item}
                  data-active={ep.id === current.id ? "on" : "off"}
                  onClick={() => setActive(ep.id)}
                >
                  {ep.title}
                </button>
              </li>
            ))}
          </ol>
        ) : null}
      </div>
    </main>
  );
}
