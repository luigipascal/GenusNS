import { NextResponse } from "next/server";
import { resolveTrackAudioPath } from "@/lib/orders";
import { trackPublishStatus } from "@/lib/publish";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Publication state for a species: published (LISTEN/BUY), backlog, or awaiting master.
 */
export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const status = await trackPublishStatus(id);
  const hasMaster = Boolean(await resolveTrackAudioPath(status.id));
  return NextResponse.json({
    ...status,
    hasMaster,
    maxPerDay: 1,
  });
}
