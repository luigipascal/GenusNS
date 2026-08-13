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

export interface PlaybackState {
  trackId: string | null;
  currentTime: number;
  duration: number;
  playing: boolean;
  progress: number;
  /** Cycle step index derived from BPM + cycle length. */
  cyclePhase: number;
  activeStep: number;
  stepPhase: number;
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
  const duration = experiment.loopSec && experiment.loopSec > 0
    ? experiment.loopSec
    : Math.max(30, (60 / experiment.bpm) * experiment.cycleLength * 8);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const raf = useRef<number | null>(null);
  const last = useRef<number | null>(null);

  const tick = useCallback(
    (now: number) => {
      if (last.current == null) last.current = now;
      const dt = (now - last.current) / 1000;
      last.current = now;
      setCurrentTime((t) => {
        const next = t + dt;
        if (next >= duration) {
          setPlaying(false);
          return duration;
        }
        return next;
      });
      raf.current = requestAnimationFrame(tick);
    },
    [duration],
  );

  useEffect(() => {
    if (!playing) {
      if (raf.current != null) cancelAnimationFrame(raf.current);
      raf.current = null;
      last.current = null;
      return;
    }
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current != null) cancelAnimationFrame(raf.current);
    };
  }, [playing, tick]);

  // Reset when species changes
  useEffect(() => {
    setPlaying(false);
    setCurrentTime(0);
  }, [experiment.digest]);

  const cycleSeconds = (60 / Math.max(profile.bpm, 1)) * profile.pulseCount;
  const cyclePhase =
    cycleSeconds > 0 ? (currentTime % cycleSeconds) / cycleSeconds : 0;
  const activeStep = Math.floor(cyclePhase * profile.pulseCount) % profile.pulseCount;
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
      play: () => {
        if (currentTime >= duration) setCurrentTime(0);
        setPlaying(true);
      },
      pause: () => setPlaying(false),
      toggle: () => {
        setPlaying((p) => {
          if (!p && currentTime >= duration) setCurrentTime(0);
          return !p;
        });
      },
      seek: (t: number) => setCurrentTime(Math.min(duration, Math.max(0, t))),
    }),
    [
      experiment.digest,
      currentTime,
      duration,
      playing,
      cyclePhase,
      activeStep,
      stepPhase,
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
