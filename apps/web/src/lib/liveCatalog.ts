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
  const catalogFile = path.join(dataRoot(), "catalog.json");
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

  const expRoot = path.join(dataRoot(), "experiments");
  try {
    const dirs = await readdir(expRoot, { withFileTypes: true });
    for (const d of dirs) {
      if (!d.isDirectory()) continue;
      const law = await readLawFile(path.join(expRoot, d.name, "LAW.json"));
      if (law) out.push(law);
    }
  } catch {
    /* no experiments dir */
  }
  return out;
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
