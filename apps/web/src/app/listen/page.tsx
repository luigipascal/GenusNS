import { redirect } from "next/navigation";
import { getFeaturedExperiment } from "@genusns/genome-visuals";

export default function ListenPage() {
  const featured = getFeaturedExperiment();
  redirect(`/g/${featured.digest.slice(0, 6)}?mode=listen`);
}
