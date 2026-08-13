import { createHash } from "node:crypto";
import { mkdir, writeFile, copyFile, access, readFile } from "node:fs/promises";
import path from "node:path";
import type { ExperimentLaw } from "@genusns/genome-visuals";
import { createGenomeVisualProfile } from "@genusns/genome-visuals";
import { COVER_ARTIST, COVER_LABEL, coverCopyFor } from "./cover.js";
import { coverFileName, writeCoverPng } from "./render.js";
import { zipDittoKit } from "./zip.js";

/**
 * Ditto Music kit layout (operator uploads manually).
 *
 * READY_FOR_DITTO/<canonical>/
 *   cover.png                 3000x3000
 *   DITTO_METADATA.json       storefront fields
 *   TRACK_INFO.txt            human checklist
 *   audio/                    master wav when ingested (else README)
 *   provenance/               public law summary
 */
export interface DittoKitResult {
  kitDir: string;
  coverPath: string;
  zipPath: string;
  status: "READY_FOR_DITTO";
  manualStep: "Upload this folder's audio + cover into Ditto Music. Nothing else is automated past this point.";
}

export async function buildDittoKit(
  experiment: ExperimentLaw,
  rootDir: string,
  options: {
    audioPath?: string | null;
    coversDir?: string;
  } = {},
): Promise<DittoKitResult> {
  const short = experiment.digest.slice(0, 6).toUpperCase();
  const kitDir = path.join(rootDir, "READY_FOR_DITTO", short);
  const audioDir = path.join(kitDir, "audio");
  const provenanceDir = path.join(kitDir, "provenance");
  await mkdir(audioDir, { recursive: true });
  await mkdir(provenanceDir, { recursive: true });

  const coversDir = options.coversDir ?? path.join(rootDir, "covers");
  const coverSrc = path.join(coversDir, coverFileName(experiment));
  try {
    await access(coverSrc);
  } catch {
    await writeCoverPng(experiment, coversDir);
  }
  const coverPath = path.join(kitDir, "cover.png");
  await copyFile(coverSrc, coverPath);

  const profile = createGenomeVisualProfile(experiment);
  const copy = coverCopyFor(experiment);

  const metadata = {
    schema: "genusns.ditto-metadata.v1",
    manual_upload_only: true,
    distributor: "Ditto Music",
    release_type: "Single",
    title: copy.title,
    display_title: `${COVER_ARTIST} — ${copy.title}`,
    artist: COVER_ARTIST,
    label: COVER_LABEL,
    c_line: `${new Date().getUTCFullYear()} ${COVER_LABEL}`,
    p_line: `${new Date().getUTCFullYear()} ${COVER_LABEL}`,
    genre_hint: "Experimental",
    subgenre_hint: "Electronic",
    language: "Instrumental",
    cover_art: "cover.png",
    cover_size_px: 3000,
    tracks: [
      {
        track_number: 1,
        title: copy.title,
        artist: COVER_ARTIST,
        isrc: null,
        audio_file: options.audioPath
          ? path.basename(options.audioPath)
          : null,
        duration_sec: experiment.loopSec ?? null,
      },
    ],
    genus: {
      canonical_id: experiment.canonicalId,
      digest: experiment.digest,
      edo: experiment.edo,
      cycle: experiment.cycleLength,
      euclid: experiment.euclidean,
      accents: experiment.accentResidues,
      bpm: experiment.bpm,
      visual_profile_version: profile.version,
    },
    operator_note:
      "Upload cover.png + audio to Ditto Music manually. Do not change artist/label fields without updating GENUS//NS registry.",
  };

  await writeFile(
    path.join(kitDir, "DITTO_METADATA.json"),
    JSON.stringify(metadata, null, 2),
    "utf8",
  );

  await writeFile(
    path.join(kitDir, "TRACK_INFO.txt"),
    [
      "GENUS//NS → DITTO MUSIC (MANUAL UPLOAD)",
      "=====================================",
      "",
      `Title:    ${copy.title}`,
      `Artist:   ${COVER_ARTIST}`,
      `Label:    ${COVER_LABEL}`,
      `Cover:    cover.png (3000x3000, genome wheel)`,
      `Canonical:${experiment.canonicalId}`,
      "",
      "ONLY MANUAL STEP:",
      "  1. Open Ditto Music",
      "  2. Create release (Single)",
      "  3. Upload cover.png",
      "  4. Upload the master WAV from audio/",
      "  5. Paste metadata from DITTO_METADATA.json",
      "  6. After stores go live, paste DSP links back into GENUS//NS Studio",
      "",
      "Everything else in GENUS//NS is automated.",
      "",
    ].join("\n"),
    "utf8",
  );

  await writeFile(
    path.join(provenanceDir, "LAW.json"),
    JSON.stringify(
      {
        digest: experiment.digest,
        canonicalId: experiment.canonicalId,
        edo: experiment.edo,
        cycleLength: experiment.cycleLength,
        accents: experiment.accentResidues,
        euclidean: experiment.euclidean,
        bpm: experiment.bpm,
        form: experiment.form,
        spectral: experiment.spectral,
      },
      null,
      2,
    ),
    "utf8",
  );

  if (options.audioPath) {
    const dest = path.join(audioDir, path.basename(options.audioPath));
    await copyFile(options.audioPath, dest);
  } else {
    await writeFile(
      path.join(audioDir, "README.txt"),
      "Master WAV not yet ingested.\nRun genus publish genusns from Genus desktop, then re-run the kit builder.\n",
      "utf8",
    );
  }

  const status = {
    schema: "genusns.kit-status.v1",
    status: "READY_FOR_DITTO",
    built_at: new Date().toISOString(),
    digest: experiment.digest,
    cover_sha256: createHash("sha256")
      .update(await readFile(coverPath))
      .digest("hex"),
  };
  await writeFile(
    path.join(kitDir, "STATUS.json"),
    JSON.stringify(status, null, 2),
    "utf8",
  );

  const zipPath = await zipDittoKit(kitDir);

  return {
    kitDir,
    coverPath,
    zipPath,
    status: "READY_FOR_DITTO",
    manualStep:
      "Upload this folder's audio + cover into Ditto Music. Nothing else is automated past this point.",
  };
}