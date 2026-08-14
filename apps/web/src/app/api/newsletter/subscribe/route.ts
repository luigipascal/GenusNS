import { NextResponse } from "next/server";
import {
  WELCOME_SUBJECT,
  welcomeHtml,
  welcomeText,
} from "@/lib/newsletterWelcome";
import { unsubscribeUrl } from "@/lib/newsletterUnsub";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WELCOME_ATTR = "GENUSNS_WELCOME";

type BrevoErrorBody = {
  code?: string;
  message?: string;
};

type BrevoContact = {
  email?: string;
  listIds?: number[];
  attributes?: Record<string, string | number | boolean | null>;
};

function parseListId(raw: string | undefined): number | null {
  if (!raw?.trim()) return null;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

const FROM_EMAIL =
  process.env.BREVO_FROM_EMAIL?.trim() || "genusns@genusns.com";
const FROM_NAME = process.env.BREVO_FROM_NAME?.trim() || "GENUS//NS";

function brevoHeaders(apiKey: string): Record<string, string> {
  return {
    "api-key": apiKey,
    "content-type": "application/json",
    accept: "application/json",
  };
}

async function getContact(
  apiKey: string,
  email: string,
): Promise<BrevoContact | null> {
  const res = await fetch(
    `https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`,
    { headers: brevoHeaders(apiKey) },
  );
  if (res.status === 404) return null;
  if (!res.ok) {
    console.error("Brevo get contact failed", res.status);
    return null;
  }
  return (await res.json()) as BrevoContact;
}

function alreadyWelcomed(contact: BrevoContact | null, listId: number): boolean {
  if (!contact) return false;
  const sent = String(contact.attributes?.[WELCOME_ATTR] ?? "").toLowerCase();
  const onList = (contact.listIds ?? []).includes(listId);
  return onList && sent === "sent";
}

async function ensureWelcomeAttribute(apiKey: string): Promise<void> {
  const res = await fetch(
    `https://api.brevo.com/v3/contacts/attributes/normal/${WELCOME_ATTR}`,
    {
      method: "POST",
      headers: brevoHeaders(apiKey),
      body: JSON.stringify({ type: "text" }),
    },
  );
  if (!res.ok && res.status !== 400) {
    console.error("Brevo welcome attribute", res.status, await res.text().catch(() => ""));
  }
}
  const res = await fetch(
    `https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`,
    {
      method: "PUT",
      headers: brevoHeaders(apiKey),
      body: JSON.stringify({ attributes: { [WELCOME_ATTR]: "sent" } }),
    },
  );
  if (!res.ok && res.status !== 204) {
    console.error("Brevo mark welcome failed", res.status, await res.text().catch(() => ""));
  }
}

async function sendWelcomeLetter(
  apiKey: string,
  email: string,
  origin: string,
): Promise<void> {
  const unsub = unsubscribeUrl(origin, email);
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: brevoHeaders(apiKey),
    body: JSON.stringify({
      sender: { name: FROM_NAME, email: FROM_EMAIL },
      to: [{ email }],
      subject: WELCOME_SUBJECT,
      htmlContent: welcomeHtml(unsub),
      textContent: welcomeText(unsub),
      tags: ["genusns-welcome"],
      headers: {
        "List-Unsubscribe": `<${unsub}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    }),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`Brevo welcome send failed ${res.status}: ${err.slice(0, 400)}`);
  }
}

function siteOrigin(req: Request): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (configured) return configured;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  return host ? `${proto}://${host}` : "https://genusns.com";
}

/**
 * POST { email } → Brevo list + welcome letter (with unsubscribe).
 */
export async function POST(req: Request) {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  const listId = parseListId(process.env.BREVO_NEWSLETTER_LIST_ID);
  const doiTemplateRaw = process.env.BREVO_DOI_TEMPLATE_ID?.trim();
  const doiTemplateId = doiTemplateRaw ? Number(doiTemplateRaw) : null;

  if (!apiKey || !listId) {
    return NextResponse.json(
      {
        error: "Newsletter not configured",
        hint: "Set BREVO_API_KEY and BREVO_NEWSLETTER_LIST_ID",
      },
      { status: 503 },
    );
  }

  let body: { email?: unknown };
  try {
    body = (await req.json()) as { email?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const headers = brevoHeaders(apiKey);
  const origin = siteOrigin(req);

  try {
    if (doiTemplateId && Number.isInteger(doiTemplateId) && doiTemplateId > 0) {
      const res = await fetch(
        "https://api.brevo.com/v3/contacts/doubleOptinConfirmation",
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            email,
            includeListIds: [listId],
            templateId: doiTemplateId,
            redirectionUrl: `${origin}/`,
          }),
        },
      );

      if (res.ok || res.status === 204) {
        return NextResponse.json({ ok: true, doubleOptIn: true });
      }

      const err = (await res.json().catch(() => ({}))) as BrevoErrorBody;
      if (err.code === "duplicate_parameter") {
        return NextResponse.json({ ok: true, doubleOptIn: true });
      }

      console.error("Brevo DOI subscribe failed", res.status, err);
      return NextResponse.json(
        { error: err.message ?? "Subscribe failed" },
        { status: 502 },
      );
    }

    const prior = await getContact(apiKey, email);
    if (alreadyWelcomed(prior, listId)) {
      return NextResponse.json({ ok: true, welcome: false });
    }

    const res = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers,
      body: JSON.stringify({
        email,
        listIds: [listId],
        updateEnabled: true,
      }),
    });

    if (!res.ok && res.status !== 201 && res.status !== 204) {
      const err = (await res.json().catch(() => ({}))) as BrevoErrorBody;
      if (err.code !== "duplicate_parameter") {
        console.error("Brevo subscribe failed", res.status, err);
        return NextResponse.json(
          { error: err.message ?? "Subscribe failed" },
          { status: 502 },
        );
      }
    }

    await sendWelcomeLetter(apiKey, email, origin);
    await markWelcomeSent(apiKey, email);
    return NextResponse.json({ ok: true, welcome: true });
  } catch (e) {
    console.error("Brevo subscribe error", e);
    const msg = e instanceof Error ? e.message : "Newsletter service unavailable";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
