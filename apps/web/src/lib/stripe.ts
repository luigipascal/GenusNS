import Stripe from "stripe";

let cached: Stripe | null = null;

/** Server-only Stripe client. Prefer restricted key (rk_) when available. */
export function getStripe(): Stripe {
  const key =
    process.env.STRIPE_SECRET_KEY ?? process.env.STRIPE_RESTRICTED_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY not configured");
  }
  if (!cached) {
    cached = new Stripe(key, {
      typescript: true,
    });
  }
  return cached;
}

/**
 * Public site origin for Checkout redirects.
 * GENUS//NS host is not live yet — default to 0dblabs.com.
 */
export function siteOrigin(req?: Request): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    req?.headers.get("origin") ??
    "https://0dblabs.com"
  );
}

export function randomIntegrationSuffix(length = 8): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)]!;
  }
  return out;
}

/** Registered Stripe webhook URL while genusns is offline. */
export const STRIPE_WEBHOOK_PUBLIC_URL =
  process.env.STRIPE_WEBHOOK_PUBLIC_URL ??
  "https://0dblabs.com/api/webhooks/stripe";
