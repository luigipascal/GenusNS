import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  getFirstGenome,
  listExperiments,
  type ExperimentLaw,
} from "@genusns/genome-visuals";
import { coverFileName, writeArtistImagePng, writeCoverPng } from "../render";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../..",
);
const outDirs = [path.join(repoRoot, "data", "covers")];
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

  const liveFile = path.join(repoRoot, "data", "catalog.json");
  let experiments = listExperiments();
  try {
    const parsed: unknown = JSON.parse(await readFile(liveFile, "utf8"));
    if (Array.isArray(parsed)) {
      const map = new Map(experiments.map((e) => [e.digest.toLowerCase(), e]));
      for (const row of parsed) {
        const e = row as ExperimentLaw;
        if (e?.digest) map.set(String(e.digest).toLowerCase(), e);
      }
      experiments = [...map.values()];
    }
  } catch {
    /* fixture catalog only */
  }
  console.log(`Generating ${experiments.length} covers (3000×3000)…`);
  for (const exp of experiments) {
    for (const dir of outDirs) {
      const dest = path.join(dir, coverFileName(exp));
      try {
        await access(dest);
        console.log(`  skip ${exp.canonicalId} (exists)`);
        continue;
      } catch {
        /* render */
      }
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
