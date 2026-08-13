import { NextResponse } from "next/server";
import path from "node:path";
import { listExperiments, resolveExperiment } from "@genusns/genome-visuals";
import { runPublicationPipeline } from "@genusns/pipeline";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function dataRoot(): string {
  return process.env.GENUSNS_DATA_DIR ?? path.join(process.cwd(), "..", "..", "data");
}

/** POST /api/pipeline — run automated cover + Ditto kit for one or all species. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    id?: string;
    all?: boolean;
  };

  const targets = body.all
    ? listExperiments()
    : body.id
      ? [resolveExperiment(body.id)].filter(Boolean)
      : [];

  if (targets.length === 0) {
    return NextResponse.json(
      { error: "Provide { id } or { all: true }" },
      { status: 400 },
    );
  }

  const results = [];
  for (const exp of targets) {
    if (!exp) continue;
    results.push(await runPublicationPipeline(exp, dataRoot()));
  }

  return NextResponse.json({
    ok: true,
    manual_step: "Upload READY_FOR_DITTO kits to Ditto Music",
    results,
  });
}

export async function GET() {
  return NextResponse.json({
    service: "genusns-pipeline",
    artist: "GENUS//NS",
    label: "0dB_Labs",
    distributor: "Ditto Music",
    automated: [
      "cover generation (genome wheel)",
      "visual profile persistence",
      "Ditto kit assembly",
      "provenance snapshot archive",
    ],
    manual_only: ["Ditto Music upload", "paste DSP links after release"],
  });
}
