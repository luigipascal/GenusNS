import { resolveLiveExperiment } from "@/lib/liveCatalog";
import { ExperimentSpecimen, type ExperimentMode } from "./specimen";

export const dynamic = "force-dynamic";

export default async function ExperimentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const mode = (["listen", "law", "trace"].includes(sp.mode ?? "")
    ? sp.mode
    : "listen") as ExperimentMode;
  const initial = await resolveLiveExperiment(id);

  return <ExperimentSpecimen id={id} initialMode={mode} initial={initial} />;
}
