import { NextResponse } from "next/server";
import { verifyUnsubscribe } from "@/lib/newsletterUnsub";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function origin(req: Request): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (configured) return configured;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  return host ? `${proto}://${host}` : "https://genusns.com";
}

function parseListId(raw: string | undefined): number | null {
  if (!raw?.trim()) return null;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

async function removeFromList(
  apiKey: string,
  listId: number,
  email: string,
): Promise<void> {
  const res = await fetch(
    `https://api.brevo.com/v3/contacts/lists/${listId}/contacts/remove`,
    {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({ emails: [email] }),
    },
  );
  if (!res.ok && res.status !== 204) {
    throw new Error(`Brevo unsubscribe ${res.status}`);
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = (url.searchParams.get("email") || "").trim().toLowerCase();
  const sig = url.searchParams.get("sig") || "";
  const site = origin(req);
  const done = `${site}/newsletter/unsubscribed`;

  if (!email || !verifyUnsubscribe(email, sig)) {
    return NextResponse.redirect(`${done}?ok=0`);
  }

  const apiKey = process.env.BREVO_API_KEY?.trim();
  const listId = parseListId(process.env.BREVO_NEWSLETTER_LIST_ID);
  if (!apiKey || !listId) {
    return NextResponse.redirect(`${done}?ok=0`);
  }

  try {
    await removeFromList(apiKey, listId, email);
    return NextResponse.redirect(`${done}?ok=1`);
  } catch (e) {
    console.error("unsubscribe failed", e);
    return NextResponse.redirect(`${done}?ok=0`);
  }
}

export async function POST(req: Request) {
  return GET(req);
}
