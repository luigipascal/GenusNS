import { createHash } from "node:crypto";
import { mkdir, writeFile, copyFile, access, readFile } from "node:fs/promises";
import path from "node:path";
import type { ExperimentLaw } from "@genusns/genome-visuals";
import { createGenomeVisualProfile } from "@genusns/genome-visuals";
import {
  createDefaultMachineRightsBundle,
  renderAiDisclosureTxt,
  renderDistributorComposerWarning,
  renderPackageRightsReadme,
  rightsPolicyConfirmedEvent,
  toReleaseSheetRights,
  validateRightsPolicy,
  type RightsPolicyBundle,
} from "@genusns/rights";
import { COVER_ARTIST, COVER_LABEL, coverCopyFor } from "./cover.js";
import { coverFileName, writeCoverPng } from "./render.js";
import { zipDittoKit } from "./zip.js";

/**
 * Ditto Music kit layout (operator uploads manually).
 *
 * READY_FOR_DITTO/<canonical>/
 *   cover.png
 *   artist.png (optional, copied by pipeline)
 *   DITTO_METADATA.json
 *   TRACK_INFO.txt
 *   AI_DISCLOSURE.txt
 *   README_RIGHTS.txt
 *   DISTRIBUTOR_COMPOSER_WARNING.txt (when applicable)
 *   RELEASE_SHEET.json
 *   RIGHTS.json
 *   audio/
 *   provenance/
 */
export interface DittoKitResult {
  kitDir: string;
  coverPath: string;
  zipPath: string;
  status: "READY_FOR_DITTO";
  rights: RightsPolicyBundle;
  manualStep: "Upload this folder's audio + cover into Ditto Music. Nothing else is automated past this point.";
}

export async function buildDittoKit(
  experiment: ExperimentLaw,
  rootDir: string,
  options: {
    audioPath?: string | null;
    coversDir?: string;
    rights?: RightsPolicyBundle;
    operatorConfirmedBy?: string;
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

  const rights =
    options.rights ??
    createDefaultMachineRightsBundle({
      operatorConfirmedBy: options.operatorConfirmedBy ?? "pipeline",
      operatorConfirmedAt: new Date().toISOString(),
    });

  const validation = validateRightsPolicy(rights);
  const releaseSheet = toReleaseSheetRights(rights);
  const confirmed = rightsPolicyConfirmedEvent(rights);

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
        // Intentionally no composer/songwriter fields when not claimed
        composer: null,
        songwriter: null,
      },
    ],
    composition: {
      status: "Machine-generated composition",
      composer_songwriter_publishing_claim: "Not claimed",
      publishing_administration: "NONE",
      authorship_status: rights.composition.authorshipStatus,
      publishing_royalty_status: rights.composition.publishingRoyaltyStatus,
    },
    master: {
      status: "Collect through distributor",
      rights_holder: rights.master.masterRightsHolder,
      revenue_collection: rights.master.masterRevenueCollectionStatus,
    },
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
      "Upload cover.png + audio to Ditto Music manually. Do not invent a composer. Composition publishing is not claimed by default; master revenue may still be collected.",
  };

  await writeFile(
    path.join(kitDir, "DITTO_METADATA.json"),
    JSON.stringify(metadata, null, 2),
    "utf8",
  );
  await writeFile(
    path.join(kitDir, "RIGHTS.json"),
    JSON.stringify(rights, null, 2),
    "utf8",
  );
  await writeFile(
    path.join(kitDir, "RELEASE_SHEET.json"),
    JSON.stringify(
      {
        schema: "genusns.release-sheet.v1",
        title: copy.title,
        artist: COVER_ARTIST,
        label: COVER_LABEL,
        digest: experiment.digest,
        ...releaseSheet,
      },
      null,
      2,
    ),
    "utf8",
  );
  await writeFile(
    path.join(kitDir, "AI_DISCLOSURE.txt"),
    renderAiDisclosureTxt(rights),
    "utf8",
  );
  await writeFile(
    path.join(kitDir, "README_RIGHTS.txt"),
    renderPackageRightsReadme(rights),
    "utf8",
  );

  const warning = renderDistributorComposerWarning(rights);
  if (warning) {
    await writeFile(
      path.join(kitDir, "DISTRIBUTOR_COMPOSER_WARNING.txt"),
      warning,
      "utf8",
    );
  }

  await writeFile(
    path.join(provenanceDir, "RIGHTS_POLICY_CONFIRMED.json"),
    JSON.stringify(confirmed, null, 2),
    "utf8",
  );
  await writeFile(
    path.join(provenanceDir, "RIGHTS_VALIDATION.json"),
    JSON.stringify(validation, null, 2),
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
      "COMPOSITION STATUS",
      "  Machine-generated composition",
      "COMPOSER/SONGWRITER PUBLISHING CLAIM",
      "  Not claimed",
      "MASTER REVENUE",
      "  Collect through distributor",
      "",
      "Do not invent a composer to fill distributor forms.",
      "See DISTRIBUTOR_COMPOSER_WARNING.txt if the form requires a composer field.",
      "",
      "ONLY MANUAL STEP:",
      "  1. Open Ditto Music",
      "  2. Create release (Single)",
      "  3. Upload cover.png (+ artist.png for profile if needed)",
      "  4. Upload the master WAV from audio/",
      "  5. Use DITTO_METADATA.json — leave composer empty / not claimed",
      "  6. After stores go live, paste DSP links back into GENUS//NS",
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
    rights_validation: validation.map((v) => ({
      code: v.code,
      severity: v.severity,
    })),
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
    rights,
    manualStep:
      "Upload this folder's audio + cover into Ditto Music. Nothing else is automated past this point.",
  };
}
