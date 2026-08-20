import { NextResponse } from "next/server";
import {
  SERVICE_CATALOG,
  trackPackageStripeDescription,
  trackPricePence,
} from "@/lib/commerce";
import { isTrackPublished } from "@/lib/publish";
import {
  getStripe,
  randomIntegrationSuffix,
  siteOrigin,
} from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Stripe Checkout Sessions for track packages and services.
 * Never put payment_method_types (use Dashboard PM config).
 */
export async function POST(req: Request) {
  let stripe;
  try {
    stripe = getStripe();
  } catch {
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

  const origin = siteOrigin(req);

  let lineName = "";
  let unitAmount = 0;
  let description = "";
  let meta: Record<string, string> = {};

  if (body.kind === "service" && body.serviceId && SERVICE_CATALOG[body.serviceId]) {
    const s = SERVICE_CATALOG[body.serviceId]!;
    lineName = s.name;
    unitAmount = s.unitAmount;
    description = s.description;
    meta = { kind: "service", serviceId: body.serviceId, project: "genusns" };
  } else if (body.kind === "track" && body.trackId) {
    const id = body.trackId.toLowerCase();
    if (!(await isTrackPublished(id))) {
      return NextResponse.json(
        {
          error: "Track not yet published",
          hint: "Packages enter a backlog; GENUS//NS publishes at most one track per day.",
        },
        { status: 409 },
      );
    }
    lineName = `GENUS//NS — ${id.toUpperCase()} full package`;
    unitAmount = trackPricePence();
    description = trackPackageStripeDescription(id);
    meta = { kind: "track", trackId: id, project: "genusns" };
  } else {
    return NextResponse.json({ error: "Invalid checkout request" }, { status: 400 });
  }

  const cancelPath =
    meta.kind === "track" && meta.trackId
      ? `/g/${meta.trackId}?checkout=cancel`
      : "/services?checkout=cancel";

  const sessionParams: Parameters<typeof stripe.checkout.sessions.create>[0] = {
    mode: "payment",
    customer_creation: "if_required",
    billing_address_collection: "auto",
    success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}${cancelPath}`,
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
  };

  // integration_identifier on newer API versions — ignore if SDK rejects
  try {
    (sessionParams as Record<string, unknown>).integration_identifier =
      `genusns_checkout_${randomIntegrationSuffix()}`;
  } catch {
    /* optional */
  }

  const session = await stripe.checkout.sessions.create(sessionParams);

  return NextResponse.json({ url: session.url, id: session.id });
}

