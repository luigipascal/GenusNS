import type { ExperimentLaw } from "./types";
import { listExperiments } from "./fixtures/catalog";

/** Explicit parameter vector for visual / exploration distance — not musical similarity. */
export function parameterVector(e: ExperimentLaw): number[] {
  return [
    e.edo / 53,
    e.cycleLength / 24,
    e.bpm / 260,
    e.spectral.inharmonicity,
    e.spectral.centroid,
    e.eventCount / 1200,
    e.euclidean[0] / Math.max(e.euclidean[1], 1),
    e.accentResidues.length / Math.max(e.cycleLength, 1),
  ];
}

export function parameterDistance(a: ExperimentLaw, b: ExperimentLaw): number {
  const va = parameterVector(a);
  const vb = parameterVector(b);
  let sum = 0;
  for (let i = 0; i < va.length; i++) {
    const d = (va[i] ?? 0) - (vb[i] ?? 0);
    sum += d * d;
  }
  return Math.sqrt(sum);
}

export function findNearExperiments(
  origin: ExperimentLaw,
  count = 3,
): ExperimentLaw[] {
  return listExperiments()
    .filter((e) => e.digest !== origin.digest)
    .map((e) => ({ e, d: parameterDistance(origin, e) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, count)
    .map((x) => x.e);
}

export function findFarExperiments(
  origin: ExperimentLaw,
  count = 3,
): ExperimentLaw[] {
  return listExperiments()
    .filter((e) => e.digest !== origin.digest)
    .map((e) => ({ e, d: parameterDistance(origin, e) }))
    .sort((a, b) => b.d - a.d)
    .slice(0, count)
    .map((x) => x.e);
}

/** Deterministic “random” pick from digest — no Math.random for URLs/shares. */
export function pickRandomSpecies(salt = "genusns"): ExperimentLaw[] {
  const all = listExperiments();
  if (all.length === 0) return [];
  let h = 0;
  for (let i = 0; i < salt.length; i++) h = (h * 31 + salt.charCodeAt(i)) >>> 0;
  const idx = h % all.length;
  return [all[idx]!];
}
