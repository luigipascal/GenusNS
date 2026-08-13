import type { ExperimentLaw } from "../types";

/**
 * Canonical design fixture — GENUS//NS:288FBD
 * Sourced from Genus desktop compiled pack 288fbdc2281bc4c8 (2026-08-13).
 */
export const experiment288fbd: ExperimentLaw = {
  digest: "288fbdc2281bc4c8",
  canonicalId: "GENUS//NS:288FBD",
  name: "Genus-288FBD",
  edo: 36,
  tonicHz: 62.69,
  generatorCents: 208.451,
  allowedDegrees: [
    0, 3, 4, 5, 8, 10, 11, 13, 14, 17, 18, 20, 22, 28, 29, 32, 33, 35,
  ],
  bpm: 93.18,
  cycleLength: 13,
  accentResidues: [7, 11],
  euclidean: [3, 13],
  spectral: {
    centroid: 0.571,
    centroidSigma: 0.156,
    roughnessMax: 0.611,
    inharmonicity: 0.485,
  },
  form: {
    nodes: ["Ash", "Drift", "B", "Lock", "E"],
    edges: [
      ["Ash", "Drift", 0.503],
      ["Drift", "B", 0.388],
      ["B", "Lock", 0.716],
      ["Lock", "E", 0.918],
      ["E", "Ash", 0.376],
    ],
  },
  eventCount: 598,
  loopSec: 83.70895,
  formPath: [
    "Ash",
    "Drift",
    "B",
    "Lock",
    "E",
    "Ash",
    "Drift",
    "B",
    "Lock",
    "E",
    "Ash",
  ],
  rhythmRule: "Euclidean(3,13) on Z/13Z with accents [7, 11]; generator 36-EDO stack",
  nearestKnown: "gamelan_proxy",
  noveltyDistance: 0.1403,
};
