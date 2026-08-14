"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PODCAST } from "@/lib/podcast";
import styles from "./podcast.module.css";

function formatTime(sec: number): string {
  const s = Math.max(0, Number.isFinite(sec) ? sec : 0);
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function PodcastClient() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onMeta = () => {
      if (Number.isFinite(el.duration) && el.duration > 0) {
        setDuration(el.duration);
        setReady(true);
      }
    };
    const onTime = () => setCurrentTime(el.currentTime);
    const onEnd = () => {
      setPlaying(false);
      setCurrentTime(el.duration || 0);
    };
    const onErr = () => setReady(false);
    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("durationchange", onMeta);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("ended", onEnd);
    el.addEventListener("error", onErr);
    el.load();
    return () => {
      el.removeEventListener("loadedmetadata", onMeta);
      el.removeEventListener("durationchange", onMeta);
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("ended", onEnd);
      el.removeEventListener("error", onErr);
    };
  }, []);

  const toggle = useCallback(() => {
    const el = audioRef.current;
    if (!el || !ready) return;
    if (el.paused) {
      void el.play().then(() => setPlaying(true));
    } else {
      el.pause();
      setPlaying(false);
    }
  }, [ready]);

  return (
    <main className={styles.page}>
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio ref={audioRef} preload="metadata" src={PODCAST.audioSrc} />
      <div className={styles.deck}>
        <button
          type="button"
          className={styles.play}
          onClick={toggle}
          disabled={!ready}
        >
          {!ready ? "LOADING" : playing ? "PAUSE" : "PLAY"}
        </button>
        <div className={`${styles.transport} mono`}>
          <span>{formatTime(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.05}
            value={currentTime}
            disabled={!ready}
            aria-label="Seek"
            onChange={(e) => {
              const t = Number(e.target.value);
              const el = audioRef.current;
              if (el) el.currentTime = t;
              setCurrentTime(t);
            }}
          />
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </main>
  );
}
