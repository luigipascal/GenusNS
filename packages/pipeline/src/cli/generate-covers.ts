import path from "node:path";
import { fileURLToPath } from "node:url";
import { getFirstGenome, listExperiments } from "@genusns/genome-visuals";
import { writeArtistImagePng, writeCoverPng } from "../render.js";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../..",
);
const outDirs = [
  path.join(repoRoot, "data", "covers"),
  path.join(repoRoot, "apps", "web", "public", "covers"),
];
const artistDirs = [
  path.join(repoRoot, "data", "identity"),
  path.join(repoRoot, "apps", "web", "public", "identity"),
  path.join(repoRoot, "data", "READY_FOR_DITTO"),
];

async function main() {
  const first = getFirstGenome();
  console.log(
    `Artist image from first genome ${first.canonicalId} (${first.edo}-EDO)…`,
  );
  const artist = await writeArtistImagePng(first, artistDirs);
  console.log(`  artist.png → ${artist.path} (${artist.bytes} bytes)`);

  const experiments = listExperiments();
  console.log(`Generating ${experiments.length} covers (3000×3000)…`);
  for (const exp of experiments) {
    for (const dir of outDirs) {
      const result = await writeCoverPng(exp, dir);
      console.log(`  ${exp.canonicalId} → ${result.path}`);
    }
  }
  console.log("Done. Artist=GENUS//NS · Label=0dB_Labs · First genome mark=00D88E");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
