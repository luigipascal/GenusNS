import path from "node:path";
import { fileURLToPath } from "node:url";
import { copyFile, mkdir } from "node:fs/promises";
import { getFirstGenome, listExperiments } from "@genusns/genome-visuals";
import { runPublicationPipeline } from "../pipeline.js";
import { writeArtistImagePng } from "../render.js";
import { zipAllDittoKits, zipDittoKit } from "../zip.js";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../..",
);
const dataRoot = path.join(repoRoot, "data");

async function main() {
  const first = getFirstGenome();
  const artist = await writeArtistImagePng(first, [
    path.join(dataRoot, "identity"),
    path.join(repoRoot, "apps", "web", "public", "identity"),
  ]);
  console.log(`Artist mark: ${artist.path}`);

  const experiments = listExperiments();
  console.log(`Running automated pipeline for ${experiments.length} species…`);
  const kitDirs: string[] = [];
  for (const exp of experiments) {
    const result = await runPublicationPipeline(exp, dataRoot);
    kitDirs.push(result.kitDir);
    // Include artist image in every kit for Ditto artist profile
    await copyFile(artist.path, path.join(result.kitDir, "artist.png"));
    const zip = await zipDittoKit(result.kitDir);
    console.log(
      `  ${result.canonicalId} → ${result.status}\n    kit: ${result.kitDir}\n    zip: ${zip}`,
    );
  }

  const master = await zipAllDittoKits(dataRoot);
  // Also copy master + artist into a single operator drop folder
  const drop = path.join(dataRoot, "OPERATOR_DROP");
  await mkdir(drop, { recursive: true });
  await copyFile(master, path.join(drop, "GENUSNS_DITTO_ALL.zip"));
  await copyFile(artist.path, path.join(drop, "artist.png"));
  console.log(`\nMaster zip: ${master}`);
  console.log(`Operator drop: ${drop}`);
  console.log("Manual step: upload kits / zips to Ditto Music.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
