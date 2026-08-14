import { NextResponse } from "next/server";
import { resolveLiveExperiment } from "@/lib/liveCatalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const experiment = await resolveLiveExperiment(id);
  if (!experiment) {
    return NextResponse.json({ error: "unknown species" }, { status: 404 });
  }
  return NextResponse.json(experiment);
}
