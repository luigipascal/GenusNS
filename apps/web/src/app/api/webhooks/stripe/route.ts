import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { upsertPaidOrder } from "@/lib/orders";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Stripe webhooks for GENUS//NS / 0dB_Labs commerce.
 * Public URL: https://genusns.com/api/webhooks/stripe
 * Requires STRIPE_WEBHOOK_SECRET. Raw body required for signature verify.
 */
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET not configured" },
      { status: 503 },
    );
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const rawBody = await req.text();
  let stripe;
  try {
    stripe = getStripe();
  } catch {
    return NextResponse.json(
      { error: "STRIPE_SECRET_KEY not configured" },
      { status: 503 },
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        const paid =
          session.payment_status === "paid" ||
          event.type === "checkout.session.async_payment_succeeded";
        if (paid) {
          await upsertPaidOrder({
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
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("[stripe webhook] handler error", event.type, err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
