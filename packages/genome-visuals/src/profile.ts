import { euclideanPattern } from "./euclidean";
import { createExperimentPalette } from "./palette";
import { createSeededRng, floatFromDigest } from "./seed";
import {
  VISUAL_PROFILE_VERSION,
  type ExperimentLaw,
  type GenomeVisualProfile,
  type VisualEdge,
} from "./types";

const GEOMETRY_VARIANTS = [
  "radial-lattice",
  "orbit-stack",
  "folded-ring",
  "split-cycle",
  "nested-arc",
] as const;

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

/**
 * Convert an ExperimentLaw into deterministic visual parameters.
 * Same experiment → same visual family. Digest supplies secondary variation only.
 */
export function createGenomeVisualProfile(
  experiment: ExperimentLaw,
): GenomeVisualProfile {
  const digest = experiment.digest.toLowerCase();
  const rng = createSeededRng(digest);
  // Consume a few draws so geometryVariant is digest-stable but not byte[0] alone
  rng();
  rng();

  const variantIndex = Math.floor(
    floatFromDigest(digest, 7) * GEOMETRY_VARIANTS.length,
  );
  const geometryVariant =
    GEOMETRY_VARIANTS[variantIndex % GEOMETRY_VARIANTS.length]!;

  const euclideanHits = euclideanPattern(
    experiment.euclidean[0],
    experiment.euclidean[1],
  );

  const graphEdges: VisualEdge[] = experiment.form.edges.map(
    ([from, to, weight]) => ({ from, to, weight }),
  );

  const eventDensity = clamp01(experiment.eventCount / 800);
  const irregularity = clamp01(experiment.spectral.inharmonicity);
  const brightnessBias = clamp01(experiment.spectral.centroid);
  const distortion = clamp01(
    experiment.spectral.roughnessMax * 0.55 + irregularity * 0.45,
  );

  // BPM → motion: subtle, not strobing (cap visual pulse rate)
  const motionRate = clamp01((experiment.bpm / 140) * 0.55 + 0.12);

  return {
    version: VISUAL_PROFILE_VERSION,
    seed: digest,
    digest,
    canonicalId: experiment.canonicalId,
    radialSegments: experiment.edo,
    pulseCount: experiment.cycleLength,
    accents: [...experiment.accentResidues].sort((a, b) => a - b),
    euclideanHits,
    allowedDegrees: [...experiment.allowedDegrees].sort((a, b) => a - b),
    nodeCount: experiment.form.nodes.length,
    graphEdges,
    formNodes: [...experiment.form.nodes],
    symmetry: clamp01(1 - irregularity * 0.7),
    irregularity,
    density: eventDensity,
    motionRate,
    brightnessBias,
    distortion,
    geometryVariant,
    rotationOffset: floatFromDigest(digest, 8) * Math.PI * 2,
    phase: floatFromDigest(digest, 9),
    lineThicknessBias: 0.7 + floatFromDigest(digest, 10) * 0.6,
    cameraAzimuth: floatFromDigest(digest, 11) * Math.PI * 2,
    centreTopology: Math.floor(floatFromDigest(digest, 12) * 5),
    palette: createExperimentPalette(digest),
    bpm: experiment.bpm,
    eventCount: experiment.eventCount,
  };
}
