import { NextResponse } from "next/server";
import {
  findOrderBySession,
  orderPublicSummary,
  upsertPaidOrder,
} from "@/lib/orders";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Confirm Checkout Session and return order summary (webhook may lag). */
export async function GET(req: Request) {
  const sessionId = new URL(req.url).searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ error: "session_id required" }, { status: 400 });
  }

  let order = await findOrderBySession(sessionId);
  if (!order) {
    try {
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.payment_status === "paid") {
        order = await upsertPaidOrder({
          sessionId: session.id,
          paymentIntentId:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : (session.payment_intent?.id ?? null),
          customerEmail:
            session.customer_details?.email ?? session.customer_email,
          amountTotal: session.amount_total,
          currency: session.currency,
          metadata: Object.fromEntries(
            Object.entries(session.metadata ?? {}).map(([k, v]) => [
              k,
              String(v ?? ""),
            ]),
          ),
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Stripe lookup failed";
      return NextResponse.json({ error: message }, { status: 503 });
    }
  }

  if (!order) {
    return NextResponse.json(
      { error: "Order not ready yet — webhook may still be processing" },
      { status: 202 },
    );
  }

  return NextResponse.json({ order: orderPublicSummary(order) });
}
