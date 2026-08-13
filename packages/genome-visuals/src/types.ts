/** Visual algorithm version — store with published experiments. */
export const VISUAL_PROFILE_VERSION = "genusns.visual.v1" as const;

export interface ExperimentLaw {
  digest: string;
  canonicalId: string;
  name: string;
  edo: number;
  tonicHz: number;
  generatorCents: number;
  allowedDegrees: number[];
  bpm: number;
  cycleLength: number;
  accentResidues: number[];
  /** Euclidean [k, n] e.g. [3, 13] */
  euclidean: [number, number];
  spectral: {
    centroid: number;
    centroidSigma: number;
    roughnessMax: number;
    inharmonicity: number;
  };
  form: {
    nodes: string[];
    edges: Array<[string, string, number]>;
  };
  eventCount: number;
  formPath: string[];
  /** Loop duration in seconds when known from compile. */
  loopSec?: number;
  rhythmRule?: string;
  nearestKnown?: string;
  noveltyDistance?: number;
}

export interface VisualEdge {
  from: string;
  to: string;
  weight: number;
}

export interface ExperimentPalette {
  foreground: string;
  background: string;
  primaryAccent: string;
  secondaryAccent: string;
  mutedAccent: string;
  /** OKLCH components for programmatic use */
  oklch: {
    primary: { l: number; c: number; h: number };
    secondary: { l: number; c: number; h: number };
  };
}

export interface GenomeVisualProfile {
  version: typeof VISUAL_PROFILE_VERSION;
  seed: string;
  digest: string;
  canonicalId: string;

  radialSegments: number;
  pulseCount: number;
  accents: number[];
  euclideanHits: number[];
  allowedDegrees: number[];

  nodeCount: number;
  graphEdges: VisualEdge[];
  formNodes: string[];

  symmetry: number;
  irregularity: number;
  density: number;

  motionRate: number;
  brightnessBias: number;
  distortion: number;

  geometryVariant: string;
  rotationOffset: number;
  phase: number;
  lineThicknessBias: number;
  cameraAzimuth: number;
  centreTopology: number;

  palette: ExperimentPalette;
  bpm: number;
  eventCount: number;
}
