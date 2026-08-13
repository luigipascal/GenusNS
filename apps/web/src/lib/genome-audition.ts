/**
 * Deterministic genome audition — Web Audio preview from ExperimentLaw.
 * Used when no published master is on the Contabo volume yet.
 * Not a substitute for the Genus realisation; factual preview of law params.
 */

import type { ExperimentLaw } from "@genusns/genome-visuals";
import { euclideanPattern } from "@genusns/genome-visuals";

export type AuditionMode = "master" | "genome-preview" | "none";

function degreeHz(experiment: ExperimentLaw, degree: number): number {
  return experiment.tonicHz * 2 ** (degree / experiment.edo);
}

function hash01(seed: string, i: number): number {
  let h = 2166136261 >>> 0;
  const s = `${seed}:${i}`;
  for (let c = 0; c < s.length; c++) {
    h ^= s.charCodeAt(c);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

export class GenomeAudition {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private timer: number | null = null;
  private startedAt = 0;
  private offsetSec = 0;
  private playing = false;
  private experiment: ExperimentLaw | null = null;

  async ensure(): Promise<AudioContext> {
    if (!this.ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      this.ctx = new AC();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.22;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") await this.ctx.resume();
    return this.ctx;
  }

  isPlaying(): boolean {
    return this.playing;
  }

  currentTime(): number {
    if (!this.playing || !this.ctx) return this.offsetSec;
    return this.offsetSec + (this.ctx.currentTime - this.startedAt);
  }

  async play(experiment: ExperimentLaw, fromSec = 0): Promise<void> {
    const ctx = await this.ensure();
    this.stopInternal(false);
    this.experiment = experiment;
    this.offsetSec = Math.max(0, fromSec);
    this.startedAt = ctx.currentTime;
    this.playing = true;
    this.scheduleLoop();
  }

  pause(): void {
    if (!this.playing) return;
    this.offsetSec = this.currentTime();
    this.stopInternal(false);
  }

  stop(): void {
    this.offsetSec = 0;
    this.stopInternal(false);
  }

  seek(experiment: ExperimentLaw, t: number): void {
    const was = this.playing;
    this.pause();
    this.offsetSec = Math.max(0, t);
    if (was) void this.play(experiment, this.offsetSec);
  }

  private stopInternal(_resetOffset: boolean): void {
    this.playing = false;
    if (this.timer != null) {
      window.clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private scheduleLoop(): void {
    if (!this.playing || !this.ctx || !this.masterGain || !this.experiment) {
      return;
    }
    const experiment = this.experiment;
    const ctx = this.ctx;
    const gain = this.masterGain;
    const hits = euclideanPattern(
      experiment.euclidean[0],
      experiment.euclidean[1],
    );
    const stepSec =
      60 / Math.max(experiment.bpm, 1) /
      Math.max(experiment.cycleLength, 1);
    // One cycle wall time = cycleLength * (60/bpm) for whole-note cycle feel
    const cycleSec =
      (60 / Math.max(experiment.bpm, 1)) * experiment.cycleLength;
    const degrees =
      experiment.allowedDegrees.length > 0
        ? experiment.allowedDegrees
        : [0, Math.floor(experiment.edo / 4), Math.floor(experiment.edo / 2)];

    const nowMusic = this.currentTime();
    const horizon = 1.25; // schedule ahead
    const t0 = nowMusic;
    const t1 = nowMusic + horizon;

    // Schedule hits in [t0, t1)
    const startCycle = Math.floor(t0 / cycleSec);
    const endCycle = Math.floor(t1 / cycleSec) + 1;
    for (let c = startCycle; c <= endCycle; c++) {
      for (const step of hits) {
        const abs = c * cycleSec + step * (cycleSec / experiment.cycleLength);
        if (abs < t0 - 0.001 || abs >= t1) continue;
        const when = ctx.currentTime + (abs - nowMusic);
        if (when < ctx.currentTime - 0.02) continue;

        const accent = experiment.accentResidues.includes(
          step % experiment.cycleLength,
        );
        const degIdx = Math.floor(
          hash01(experiment.digest, c * 64 + step) * degrees.length,
        );
        const deg = degrees[degIdx] ?? 0;
        const freq = degreeHz(experiment, deg) * (accent ? 2 : 1);
        this.strike(ctx, gain, when, freq, accent, experiment.spectral.inharmonicity);
      }
    }

    this.timer = window.setTimeout(() => this.scheduleLoop(), 400);
  }

  private strike(
    ctx: AudioContext,
    dest: GainNode,
    when: number,
    freq: number,
    accent: boolean,
    inharm: number,
  ): void {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();
    osc.type = inharm > 0.45 ? "sawtooth" : "triangle";
    osc.frequency.setValueAtTime(freq, when);
    f.type = "lowpass";
    f.frequency.setValueAtTime(800 + inharm * 2400, when);
    const peak = accent ? 0.35 : 0.18;
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(peak, when + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, when + (accent ? 0.28 : 0.16));
    osc.connect(f);
    f.connect(g);
    g.connect(dest);
    osc.start(when);
    osc.stop(when + 0.35);
  }
}

export function masterAudioUrl(trackShortId: string): string {
  const id = trackShortId.replace(/^genus\/\/ns:/i, "").slice(0, 6).toLowerCase();
  return `/api/audio/${id}`;
}
