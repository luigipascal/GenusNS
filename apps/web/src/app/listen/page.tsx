import { redirect } from "next/navigation";
import { getFeaturedExperiment } from "@genusns/genome-visuals";
import { loadPublished } from "@/lib/publish";

export default async function ListenPage() {
  const published = await loadPublished();
  const last = published.entries.at(-1);
  const featured = getFeaturedExperiment();
  const id = (last?.id ?? featured.digest.slice(0, 6)).toUpperCase();
  redirect(`/g/${id}?mode=listen`);
}
