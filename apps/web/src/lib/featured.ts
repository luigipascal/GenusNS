import { getFeaturedExperiment, type ExperimentLaw } from "@genusns/genome-visuals";
import { listLiveExperiments } from "./liveCatalog";
import { loadPublished } from "./publish";

function shortId(digest: string): string {
  return digest.replace(/[^a-fA-F0-9]/gi, "").slice(0, 6).toUpperCase();
}

/** Newest UTC publish — the species LISTEN / current mark should show. */
export async function latestPublishedExperiment(): Promise<ExperimentLaw> {
  const [published, experiments] = await Promise.all([
    loadPublished(),
    listLiveExperiments(),
  ]);
  const last = [...published.entries].sort((a, b) =>
    a.publishedAt.localeCompare(b.publishedAt),
  ).at(-1);
  if (last) {
    const id = last.id.replace(/[^a-fA-F0-9]/gi, "").slice(0, 6).toUpperCase();
    const found = experiments.find((e) => shortId(e.digest) === id);
    if (found) return found;
  }
  return getFeaturedExperiment();
}
