import path from "node:path";
import { fileURLToPath } from "node:url";
import { listExperiments } from "@genusns/genome-visuals";
import { buildDittoKit } from "../ditto-kit.js";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../..",
);
const dataRoot = path.join(repoRoot, "data");

async function main() {
  for (const exp of listExperiments()) {
    const kit = await buildDittoKit(exp, dataRoot, {
      coversDir: path.join(dataRoot, "covers"),
    });
    console.log(`${exp.canonicalId} → ${kit.kitDir}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
