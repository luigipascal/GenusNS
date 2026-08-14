import { readdir, readFile, access } from "node:fs/promises";
import path from "node:path";
import {
  experimentCatalog,
  type ExperimentLaw,
} from "@genusns/genome-visuals";
import { dataRoot } from "./orders";

function normDigest(id: string): string {
  return id
    .trim()
    .toLowerCase()
    .replace(/^genus\/\/ns:/, "")
    .replace(/[^a-f0-9]/g, "");
}

function isLaw(value: unknown): value is ExperimentLaw {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  return typeof o.digest === "string" && typeof o.edo === "number";
}

async function readLawFile(file: string): Promise<ExperimentLaw | null> {
  try {
    await access(file);
    const parsed: unknown = JSON.parse(await readFile(file, "utf8"));
    return isLaw(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

async function loadDiskExperiments(): Promise<ExperimentLaw[]> {
  const out: ExperimentLaw[] = [];
  const root = dataRoot();
  const catalogFile = path.join(root, "catalog.json");
  try {
    const raw = await readFile(catalogFile, "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      for (const row of parsed) {
        if (isLaw(row)) out.push(row);
      }
    }
  } catch {
    /* optional live catalog */
  }

  for (const folder of ["experiments", "packages"] as const) {
    const expRoot = path.join(root, folder);
    try {
      const dirs = await readdir(expRoot, { withFileTypes: true });
      for (const d of dirs) {
        if (!d.isDirectory()) continue;
        const base = path.join(expRoot, d.name);
        const law =
          (await readLawFile(path.join(base, "LAW.json"))) ??
          (await readLawFile(path.join(base, "raw", "LAW.json")));
        if (law) out.push(law);
      }
    } catch {
      /* folder may be absent */
    }
  }

  const approvedRoot = path.join(root, "approved");
  try {
    const files = await readdir(approvedRoot);
    for (const name of files) {
      if (!name.endsWith(".json")) continue;
      const law = await readApprovedFile(path.join(approvedRoot, name));
      if (law) out.push(law);
    }
  } catch {
    /* no approved dir */
  }
  return out;
}

function lawFromApproved(value: unknown): ExperimentLaw | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const g = row.genome;
  if (!g || typeof g !== "object") return null;
  const genome = g as Record<string, unknown>;
  const pitch = genome.pitch as Record<string, unknown> | undefined;
  const meter = genome.meter as Record<string, unknown> | undefined;
  const spectral = genome.spectral as Record<string, unknown> | undefined;
  const form = genome.form as Record<string, unknown> | undefined;
  const digest = String(row.math_digest || row.id || genome.math_digest || "").toLowerCase();
  if (!digest || typeof pitch?.edo !== "number") return null;
  const short = digest.slice(0, 6).toUpperCase();
  const eu = meter?.subdivision_euclidean;
  const euclid: [number, number] = Array.isArray(eu) && eu.length >= 2
    ? [Number(eu[0]), Number(eu[1])]
    : [0, Number(meter?.cycle_length) || 1];
  const pulse = Number(meter?.pulse_hz) || 0;
  const nodes = Array.isArray(form?.nodes) ? (form.nodes as string[]) : [];
  return {
    digest,
    canonicalId: `GENUS//NS:${short}`,
    name: String(row.name || genome.name || `Genus-${short}`),
    edo: Number(pitch.edo),
    tonicHz: Number(pitch.tonic_hz) || 0,
    generatorCents: Number(pitch.generator_cents) || 0,
    allowedDegrees: Array.isArray(pitch.allowed_degrees)
      ? (pitch.allowed_degrees as number[])
      : [],
    bpm: pulse > 0 ? pulse * 60 : 120,
    cycleLength: Number(meter?.cycle_length) || 1,
    accentResidues: Array.isArray(meter?.accent_residues)
      ? (meter.accent_residues as number[])
      : [],
    euclidean: euclid,
    spectral: {
      centroid: Number(spectral?.centroid_mu) || 0,
      centroidSigma: Number(spectral?.centroid_sigma) || 0,
      roughnessMax: Number(spectral?.roughness_max) || 0,
      inharmonicity: Number(spectral?.inharmonicity) || 0,
    },
    form: {
      nodes,
      edges: Array.isArray(form?.edges)
        ? (form.edges as Array<[string, string, number]>)
        : [],
    },
    eventCount: 0,
    formPath: nodes,
    rhythmRule: typeof genome.rhythm_rule === "string" ? genome.rhythm_rule : undefined,
    nearestKnown:
      typeof (genome.provenance as { nearest_known?: string } | undefined)
        ?.nearest_known === "string"
        ? (genome.provenance as { nearest_known: string }).nearest_known
        : undefined,
    noveltyDistance:
      typeof (genome.provenance as { novelty_distance?: number } | undefined)
        ?.novelty_distance === "number"
        ? (genome.provenance as { novelty_distance: number }).novelty_distance
        : undefined,
  };
}

async function readApprovedFile(file: string): Promise<ExperimentLaw | null> {
  try {
    const parsed: unknown = JSON.parse(await readFile(file, "utf8"));
    return isLaw(parsed) ? parsed : lawFromApproved(parsed);
  } catch {
    return null;
  }
}

function mergeCatalog(parts: ExperimentLaw[][]): ExperimentLaw[] {
  const map = new Map<string, ExperimentLaw>();
  for (const list of parts) {
    for (const e of list) {
      map.set(e.digest.toLowerCase(), e);
    }
  }
  return [...map.values()].sort((a, b) => a.digest.localeCompare(b.digest));
}

export async function listLiveExperiments(): Promise<ExperimentLaw[]> {
  const disk = await loadDiskExperiments();
  return mergeCatalog([experimentCatalog, disk]);
}

export async function resolveLiveExperiment(
  id: string,
): Promise<ExperimentLaw | null> {
  const raw = normDigest(id);
  if (raw.length < 4) return null;
  const all = await listLiveExperiments();
  return (
    all.find((e) => e.digest.toLowerCase() === raw) ??
    all.find((e) => e.digest.slice(0, 6).toLowerCase() === raw.slice(0, 6)) ??
    null
  );
}
