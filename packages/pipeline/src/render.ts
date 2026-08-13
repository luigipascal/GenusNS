import { createHash } from "node:crypto";
import { mkdir, writeFile, readFile, access } from "node:fs/promises";
import path from "node:path";
import {
  createGenomeVisualProfile,
  type ExperimentLaw,
} from "@genusns/genome-visuals";
import { renderArtistImageSvg } from "./artist";
import {
  COVER_SIZE,
  coverCopyFor,
  renderAlbumCoverSvg,
} from "./cover";

async function sharpPng(svg: string): Promise<Buffer> {
  // Lazy-load so Next.js page-data collection does not require native sharp at build time.
  const { default: sharp } = await import("sharp");
  return sharp(Buffer.from(svg)).png().toBuffer();
}

export async function renderCoverPng(
  experiment: ExperimentLaw,
  size = COVER_SIZE,
): Promise<Buffer> {
  const profile = createGenomeVisualProfile(experiment);
  const copy = coverCopyFor(experiment);
  const svg = renderAlbumCoverSvg(profile, copy, size);
  return sharpPng(svg);
}

export async function renderArtistPng(
  experiment: ExperimentLaw,
  size = COVER_SIZE,
): Promise<Buffer> {
  const profile = createGenomeVisualProfile(experiment);
  const svg = renderArtistImageSvg(profile, experiment, size);
  return sharpPng(svg);
}

export function coverFileName(experiment: ExperimentLaw): string {
  return `${experiment.digest.slice(0, 6).toLowerCase()}.png`;
}

export async function writeCoverPng(
  experiment: ExperimentLaw,
  outDir: string,
  size = COVER_SIZE,
): Promise<{ path: string; sha256: string; bytes: number }> {
  await mkdir(outDir, { recursive: true });
  const file = path.join(outDir, coverFileName(experiment));
  const buf = await renderCoverPng(experiment, size);
  await writeFile(file, buf);
  const sha256 = createHash("sha256").update(buf).digest("hex");
  return { path: file, sha256, bytes: buf.length };
}

export async function writeArtistImagePng(
  experiment: ExperimentLaw,
  outDirs: string[],
  size = COVER_SIZE,
): Promise<{ path: string; sha256: string; bytes: number }> {
  const buf = await renderArtistPng(experiment, size);
  const sha256 = createHash("sha256").update(buf).digest("hex");
  let firstPath = "";
  for (const dir of outDirs) {
    await mkdir(dir, { recursive: true });
    const file = path.join(dir, "artist.png");
    await writeFile(file, buf);
    if (!firstPath) firstPath = file;
  }
  return { path: firstPath, sha256, bytes: buf.length };
}

export async function fileExists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

export async function readJson<T>(p: string): Promise<T> {
  return JSON.parse(await readFile(p, "utf8")) as T;
}
