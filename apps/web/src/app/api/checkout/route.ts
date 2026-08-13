import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SERVICES: Record<
  string,
  { name: string; unitAmount: number; description: string }
> = {
  "genome-commission": {
    name: "GENUS//NS — Genome commission",
    unitAmount: 45000,
    description: "Custom genome pack + species record",
  },
  "refine-master": {
    name: "GENUS//NS — Refine & master consult",
    unitAmount: 18000,
    description: "Performance-layer analysis consult",
  },
  "release-kit": {
    name: "GENUS//NS — Release kit",
    unitAmount: 9000,
    description: "Cover, artist mark, Ditto-ready pack",
  },
};

/**
 * Stripe Checkout Sessions for track downloads and services.
 * Requires STRIPE_SECRET_KEY. Never put payment_method_types (use Dashboard PM config).
 */
export async function POST(req: Request) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "STRIPE_SECRET_KEY not configured" },
      { status: 503 },
    );
  }

  const body = (await req.json()) as {
    kind?: "service" | "track";
    serviceId?: string;
    trackId?: string;
  };

  const stripe = new Stripe(key);
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ??
    req.headers.get("origin") ??
    "http://localhost:3456";

  let lineName = "";
  let unitAmount = 0;
  let description = "";
  let meta: Record<string, string> = {};

  if (body.kind === "service" && body.serviceId && SERVICES[body.serviceId]) {
    const s = SERVICES[body.serviceId]!;
    lineName = s.name;
    unitAmount = s.unitAmount;
    description = s.description;
    meta = { kind: "service", serviceId: body.serviceId };
  } else if (body.kind === "track" && body.trackId) {
    lineName = `GENUS//NS — ${body.trackId.toUpperCase()} download`;
    unitAmount = Number(process.env.STRIPE_TRACK_PRICE_GBP_PENCE ?? 299);
    description = "High-quality download · experimental species recording";
    meta = { kind: "track", trackId: body.trackId.toLowerCase() };
  } else {
    return NextResponse.json({ error: "Invalid checkout request" }, { status: 400 });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: `${origin}/about?checkout=success`,
    cancel_url: `${origin}/services?checkout=cancel`,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "gbp",
          unit_amount: unitAmount,
          product_data: {
            name: lineName,
            description,
          },
        },
      },
    ],
    metadata: meta,
  });

  return NextResponse.json({ url: session.url, id: session.id });
}
