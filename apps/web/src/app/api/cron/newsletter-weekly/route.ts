import { NextResponse } from "next/server";
import {
  publicCatalogue,
  sendWeeklyCampaign,
  speciesOnUtcDay,
  speciesSince,
  weekKey,
} from "@/lib/newsletterWeekly";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization") || "";
  if (secret && auth === `Bearer ${secret}`) return true;
  const host = req.headers.get("host") || "";
  return host.startsWith("127.0.0.1") || host.startsWith("localhost");
}

/**
 * Local/cron: Saturday bulletin + catalogue snapshot.
 * GET  → status (what published this week / today)
 * GET?send=1 → assemble and send to Brevo list
 */
export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const send = url.searchParams.get("send") === "1";
  const force = url.searchParams.get("force") === "1";
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const cat = await publicCatalogue();
  const snapshot = {
    utcDay: today,
    week: weekKey(now),
    totalPublic: cat.total,
    publishedToday: await speciesOnUtcDay(today),
    publishedLast7Days: await speciesSince(7, now),
  };
  if (!send) {
    return NextResponse.json({ ok: true, ...snapshot });
  }
  try {
    const result = await sendWeeklyCampaign({ force, now });
    return NextResponse.json({ ok: true, ...snapshot, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "send failed";
    console.error("weekly newsletter", msg);
    return NextResponse.json({ error: msg, ...snapshot }, { status: 502 });
  }
}
