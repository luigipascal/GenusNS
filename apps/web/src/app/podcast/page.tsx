import { LEGAL } from "@/lib/legal";
import { PODCAST } from "@/lib/podcast";
import { PodcastClient } from "./podcast-client";

export const metadata = {
  title: `${PODCAST.show} ${PODCAST.episode}`,
  description: `First automated GENUS//NS podcast episode. AI-written, AI-spoken. Genome of record ${PODCAST.genomeId}. ${LEGAL.imprint}.`,
};

export default function PodcastPage() {
  return <PodcastClient />;
}
