import { createHash } from "node:crypto";
import { mkdir, writeFile, readFile, readdir, copyFile, access } from "node:fs/promises";
import path from "node:path";
import type { ExperimentLaw } from "@genusns/genome-visuals";
import { createGenomeVisualProfile } from "@genusns/genome-visuals";
import { createDefaultMachineRightsBundle } from "@genusns/rights";
import { writeCoverPng } from "./render";
import { buildDittoKit } from "./ditto-kit";

export interface IngestResult {
  genusnsId: string;
  canonicalId: string;
  digest: string;
  revision: number;
  coverPath: string;
  kitDir: string;
  status: "READY_FOR_DITTO";
}

function sha256(buf: Buffer): string {
  return createHash("sha256").update(buf).digest("hex");
}

/**
 * Automated publication pipeline after a Genus snapshot arrives.
 * Final human step: Ditto Music upload only.
 */
export async function runPublicationPipeline(
  experiment: ExperimentLaw,
  dataRoot: string,
  options: { audioPath?: string | null; snapshotDir?: string } = {},
): Promise<IngestResult> {
  const digest = experiment.digest.toLowerCase();
  const short = digest.slice(0, 6);
  const expDir = path.join(dataRoot, "experiments", digest);
  await mkdir(expDir, { recursive: true });

  // Persist law + visual profile (immutable identity)
  const profile = createGenomeVisualProfile(experiment);
  await writeFile(
    path.join(expDir, "LAW.json"),
    JSON.stringify(experiment, null, 2),
    "utf8",
  );
  await writeFile(
    path.join(expDir, "VISUAL_PROFILE.json"),
    JSON.stringify(profile, null, 2),
    "utf8",
  );

  const rights = createDefaultMachineRightsBundle({
    operatorConfirmedBy: "pipeline",
    operatorConfirmedAt: new Date().toISOString(),
  });
  await writeFile(
    path.join(expDir, "RIGHTS.json"),
    JSON.stringify(rights, null, 2),
    "utf8",
  );

  if (options.snapshotDir) {
    const snapOut = path.join(expDir, "snapshot");
    await mkdir(snapOut, { recursive: true });
    const files = await readdir(options.snapshotDir);
    for (const f of files) {
      await copyFile(
        path.join(options.snapshotDir, f),
        path.join(snapOut, f),
      );
    }
  }

  const coversDir = path.join(dataRoot, "covers");
  const publicCovers = path.join(dataRoot, "public-covers");
  const existingCover = path.join(coversDir, `${short}.png`);
  let cover: { path: string; sha256: string; bytes: number };
  try {
    await access(existingCover);
    const buf = await readFile(existingCover);
    cover = {
      path: existingCover,
      sha256: createHash("sha256").update(buf).digest("hex"),
      bytes: buf.length,
    };
  } catch {
    cover = await writeCoverPng(experiment, coversDir);
  }
  await mkdir(publicCovers, { recursive: true });
  await copyFile(cover.path, path.join(publicCovers, path.basename(cover.path)));

  // Also write a web-public copy when running from repo
  const revisionPath = path.join(expDir, "REVISION.json");
  let revision = 1;
  try {
    const prev = JSON.parse(await readFile(revisionPath, "utf8")) as {
      revision?: number;
    };
    revision = (prev.revision ?? 0) + 1;
  } catch {
    revision = 1;
  }

  const record = {
    schema: "genusns.experiment-record.v1",
    genusns_id: `gns_${short}_${digest.slice(6, 14)}`,
    canonical_id: experiment.canonicalId,
    digest,
    revision,
    artist: "GENUS//NS",
    label: "0dB_Labs",
    cover_sha256: cover.sha256,
    status: "READY_FOR_DITTO",
    updated_at: new Date().toISOString(),
  };
  await writeFile(revisionPath, JSON.stringify(record, null, 2), "utf8");
  await writeFile(
    path.join(expDir, "RECORD.json"),
    JSON.stringify(record, null, 2),
    "utf8",
  );

  const kit = await buildDittoKit(experiment, dataRoot, {
    audioPath: options.audioPath,
    coversDir,
    rights,
    operatorConfirmedBy: "pipeline",
  });

  // Maintain index of kits awaiting Ditto upload
  const indexPath = path.join(dataRoot, "READY_FOR_DITTO", "INDEX.json");
  await mkdir(path.dirname(indexPath), { recursive: true });
  let index: Array<Record<string, unknown>> = [];
  try {
    index = JSON.parse(await readFile(indexPath, "utf8")) as Array<
      Record<string, unknown>
    >;
  } catch {
    index = [];
  }
  index = index.filter((row) => row.digest !== digest);
  index.push({
    digest,
    canonical_id: experiment.canonicalId,
    title: digest.slice(0, 6).toUpperCase(),
    artist: "GENUS//NS",
    label: "0dB_Labs",
    kit_dir: kit.kitDir,
    status: "READY_FOR_DITTO",
    updated_at: new Date().toISOString(),
  });
  await writeFile(indexPath, JSON.stringify(index, null, 2), "utf8");

  return {
    genusnsId: record.genusns_id,
    canonicalId: experiment.canonicalId,
    digest,
    revision,
    coverPath: cover.path,
    kitDir: kit.kitDir,
    status: "READY_FOR_DITTO",
  };
}

export async function verifyAssetHashes(
  assets: Array<{ path: string; sha256: string }>,
  baseDir: string,
): Promise<{ ok: boolean; failures: string[] }> {
  const failures: string[] = [];
  for (const a of assets) {
    const buf = await readFile(path.join(baseDir, a.path));
    const got = sha256(buf);
    if (got !== a.sha256.toLowerCase()) {
      failures.push(`${a.path}: expected ${a.sha256}, got ${got}`);
    }
  }
  return { ok: failures.length === 0, failures };
}
