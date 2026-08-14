import { createHmac, timingSafeEqual } from "node:crypto";

function secret(): string {
  return (
    process.env.NEWSLETTER_UNSUB_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    process.env.BREVO_API_KEY?.trim() ||
    ""
  );
}

export function unsubscribeSignature(email: string): string {
  const key = secret();
  if (!key) return "";
  return createHmac("sha256", key).update(email.trim().toLowerCase()).digest("hex");
}

export function unsubscribeUrl(origin: string, email: string): string {
  const e = encodeURIComponent(email.trim().toLowerCase());
  const sig = unsubscribeSignature(email);
  return `${origin.replace(/\/$/, "")}/api/newsletter/unsubscribe?email=${e}&sig=${sig}`;
}

export function verifyUnsubscribe(email: string, sig: string): boolean {
  const expected = unsubscribeSignature(email);
  if (!expected || !sig || expected.length !== sig.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
}
