import { LEGAL } from "@/lib/legal";
import { PODCAST } from "@/lib/podcast";
import { listYoutubeEpisodes } from "@/lib/youtubeEpisodes";
import { PodcastClient } from "./podcast-client";

export const revalidate = 300;

export const metadata = {
  title: `${PODCAST.show}`,
  description: `GENUS//NS Dispatch. Episodes publish on YouTube and appear here automatically. ${LEGAL.imprint}.`,
};

export default async function PodcastPage() {
  const episodes = await listYoutubeEpisodes();
  return <PodcastClient episodes={episodes} />;
}
