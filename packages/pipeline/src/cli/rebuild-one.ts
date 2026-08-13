import { resolveExperiment } from "@genusns/genome-visuals";
import { buildDittoKit } from "../ditto-kit.js";

const exp = resolveExperiment("288fbd");
if (!exp) throw new Error("missing 288fbd");
const r = await buildDittoKit(exp, "E:/0dblabs/GenusNS/data");
console.log(JSON.stringify({
  kitDir: r.kitDir,
  authorship: r.rights.composition.authorshipStatus,
  publishing: r.rights.composition.publishingRoyaltyStatus,
  master: r.rights.master.masterRevenueCollectionStatus,
  authors: r.rights.composition.claimedAuthors.length,
}, null, 2));
