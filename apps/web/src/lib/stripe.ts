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
 * Canonical host is genusns.com — ignore stale Coolify sslip.io / 0dblabs fallbacks.
 */
export function siteOrigin(req?: Request): string {
  const configured = (
    process.env.GENUSNS_CHECKOUT_ORIGIN ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    ""
  ).replace(/\/$/, "");
  if (configured.includes("genusns.com")) return configured;
  const header = req?.headers.get("origin") ?? "";
  if (header.includes("genusns.com")) return header.replace(/\/$/, "");
  return "https://genusns.com";
}

export function randomIntegrationSuffix(length = 8): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)]!;
  }
  return out;
}

/** Live Stripe webhook for GENUS//NS fulfilment. */
export const STRIPE_WEBHOOK_PUBLIC_URL =
  process.env.STRIPE_WEBHOOK_PUBLIC_URL ??
  "https://genusns.com/api/webhooks/stripe";

