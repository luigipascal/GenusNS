import catalogJson from "./catalog.json";
import type { ExperimentLaw } from "../types";

export const experimentCatalog: ExperimentLaw[] =
  catalogJson as ExperimentLaw[];

const byDigest = new Map(
  experimentCatalog.map((e) => [e.digest.toLowerCase(), e]),
);
const byShort = new Map(
  experimentCatalog.map((e) => [e.digest.slice(0, 6).toLowerCase(), e]),
);

export function listExperiments(): ExperimentLaw[] {
  return experimentCatalog;
}

/** Resolve short id (288fbd), full digest, or GENUS//NS:288FBD. */
export function resolveExperiment(id: string): ExperimentLaw | null {
  const raw = id.trim().toLowerCase().replace(/^genus\/\/ns:/, "");
  return byDigest.get(raw) ?? byShort.get(raw.slice(0, 6)) ?? null;
}

export function getFeaturedExperiment(): ExperimentLaw {
  return (
    resolveExperiment("288fbdc2281bc4c8") ??
    experimentCatalog[0]!
  );
}

/** Earliest compiled genome in the catalog batch (00D88E). Used for artist mark. */
export const FIRST_GENOME_DIGEST = "00d88ef0aa406864";

export function getFirstGenome(): ExperimentLaw {
  return resolveExperiment(FIRST_GENOME_DIGEST) ?? experimentCatalog[0]!;
}
