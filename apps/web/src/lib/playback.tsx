"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { ExperimentLaw, GenomeVisualProfile } from "@genusns/genome-visuals";
import { masterAudioUrl, type AuditionMode } from "./genome-audition";

export interface PlaybackState {
  trackId: string | null;
  currentTime: number;
  duration: number;
  playing: boolean;
  progress: number;
  cyclePhase: number;
  activeStep: number;
  stepPhase: number;
  /** master = Genus-generated file; awaiting-master = law only, no audio yet */
  mode: AuditionMode;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seek: (t: number) => void;
}

const PlaybackContext = createContext<PlaybackState | null>(null);

export function PlaybackProvider({
  experiment,
  profile,
  children,
}: {
  experiment: ExperimentLaw;
  profile: GenomeVisualProfile;
  children: ReactNode;
}) {
  const fallbackDuration =
    experiment.loopSec && experiment.loopSec > 0
      ? experiment.loopSec
      : Math.max(30, (60 / experiment.bpm) * experiment.cycleLength * 8);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(fallbackDuration);
  const [mode, setMode] = useState<AuditionMode>("awaiting-master");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const raf = useRef<number | null>(null);
  const modeRef = useRef<AuditionMode>("awaiting-master");

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  // Probe Contabo / public master only — never invent a preview track.
  useEffect(() => {
    let cancelled = false;
    const short = experiment.digest.slice(0, 6);
    const url = masterAudioUrl(short);

    setPlaying(false);
    setCurrentTime(0);
    setDuration(fallbackDuration);
    setMode("awaiting-master");

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }

    (async () => {
      try {
        const head = await fetch(url, { method: "HEAD" });
        if (cancelled) return;
        if (!head.ok) return;
        const el = new Audio();
        el.preload = "metadata";
        el.src = url;
        el.loop = false;
        await new Promise<void>((resolve, reject) => {
          el.addEventListener("loadedmetadata", () => resolve(), { once: true });
          el.addEventListener("error", () => reject(new Error("audio error")), {
            once: true,
          });
        });
        if (cancelled) return;
        audioRef.current = el;
        setDuration(
          Number.isFinite(el.duration) && el.duration > 0
            ? el.duration
            : fallbackDuration,
        );
        setMode("master");
      } catch {
        /* stay awaiting-master */
      }
    })();

    return () => {
      cancelled = true;
      audioRef.current?.pause();
    };
  }, [experiment.digest, fallbackDuration]);

  const tickVisual = useCallback(
    (now: number) => {
      void now;
      if (modeRef.current === "master" && audioRef.current) {
        const el = audioRef.current;
        setCurrentTime(el.currentTime);
        if (el.ended) {
          setPlaying(false);
          setCurrentTime(el.duration || duration);
          if (raf.current != null) cancelAnimationFrame(raf.current);
          raf.current = null;
          return;
        }
      }
      raf.current = requestAnimationFrame(tickVisual);
    },
    [duration],
  );

  useEffect(() => {
    if (!playing) {
      if (raf.current != null) cancelAnimationFrame(raf.current);
      raf.current = null;
      return;
    }
    raf.current = requestAnimationFrame(tickVisual);
    return () => {
      if (raf.current != null) cancelAnimationFrame(raf.current);
    };
  }, [playing, tickVisual]);

  const play = useCallback(() => {
    void (async () => {
      if (mode !== "master" || !audioRef.current) return;
      if (
        audioRef.current.currentTime >=
        (audioRef.current.duration || duration) - 0.05
      ) {
        audioRef.current.currentTime = 0;
      }
      await audioRef.current.play();
      setPlaying(true);
    })();
  }, [mode, duration]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    if (playing) pause();
    else play();
  }, [playing, pause, play]);

  const seek = useCallback(
    (t: number) => {
      const clamped = Math.min(duration, Math.max(0, t));
      setCurrentTime(clamped);
      if (mode === "master" && audioRef.current) {
        audioRef.current.currentTime = clamped;
      }
    },
    [duration, mode],
  );

  const cycleSeconds = (60 / Math.max(profile.bpm, 1)) * profile.pulseCount;
  const cyclePhase =
    cycleSeconds > 0 ? (currentTime % cycleSeconds) / cycleSeconds : 0;
  const activeStep =
    Math.floor(cyclePhase * profile.pulseCount) % profile.pulseCount;
  const stepPhase = (cyclePhase * profile.pulseCount) % 1;

  const value = useMemo<PlaybackState>(
    () => ({
      trackId: experiment.digest,
      currentTime,
      duration,
      playing,
      progress: duration > 0 ? currentTime / duration : 0,
      cyclePhase,
      activeStep,
      stepPhase,
      mode,
      play,
      pause,
      toggle,
      seek,
    }),
    [
      experiment.digest,
      currentTime,
      duration,
      playing,
      cyclePhase,
      activeStep,
      stepPhase,
      mode,
      play,
      pause,
      toggle,
      seek,
    ],
  );

  return (
    <PlaybackContext.Provider value={value}>{children}</PlaybackContext.Provider>
  );
}

export function usePlayback(): PlaybackState {
  const ctx = useContext(PlaybackContext);
  if (!ctx) {
    throw new Error("usePlayback requires PlaybackProvider");
  }
  return ctx;
}
