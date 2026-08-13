import { ExperimentSpecimen, type ExperimentMode } from "./specimen";

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

  return <ExperimentSpecimen id={id} initialMode={mode} />;
}
