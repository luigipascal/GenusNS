import { NextResponse } from "next/server";
import { resolveTrackAudioPath } from "@/lib/orders";
import { trackPublishStatus } from "@/lib/publish";
import { smartLinkFor } from "@/lib/smartlinks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Publication state for a species: published (LISTEN/BUY), backlog, or awaiting master.
 * Includes Ditto smart-link when harvested into data/smartlinks.json.
 */
export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const status = await trackPublishStatus(id);
  const hasMaster = Boolean(await resolveTrackAudioPath(status.id));
  const smartLink = await smartLinkFor(status.id);
  return NextResponse.json({
    ...status,
    hasMaster,
    smartLink,
    maxPerDay: 1,
  });
}
