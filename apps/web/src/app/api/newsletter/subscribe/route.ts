import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type BrevoErrorBody = {
  code?: string;
  message?: string;
};

function parseListId(raw: string | undefined): number | null {
  if (!raw?.trim()) return null;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function siteOrigin(req: Request): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (configured) return configured;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  return host ? `${proto}://${host}` : "https://genusns.com";
}

/**
 * POST { email } → Brevo contacts (or DOI confirmation when template id set).
 * API key never leaves the server.
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

  const headers = {
    "api-key": apiKey,
    "content-type": "application/json",
    accept: "application/json",
  };

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
            redirectionUrl: `${siteOrigin(req)}/`,
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

    const res = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers,
      body: JSON.stringify({
        email,
        listIds: [listId],
        updateEnabled: true,
      }),
    });

    if (res.ok || res.status === 204) {
      return NextResponse.json({ ok: true });
    }

    const err = (await res.json().catch(() => ({}))) as BrevoErrorBody;
    // Already on the list / contact exists — treat as success
    if (err.code === "duplicate_parameter") {
      return NextResponse.json({ ok: true });
    }

    console.error("Brevo subscribe failed", res.status, err);
    return NextResponse.json(
      { error: err.message ?? "Subscribe failed" },
      { status: 502 },
    );
  } catch (e) {
    console.error("Brevo subscribe network error", e);
    return NextResponse.json(
      { error: "Newsletter service unavailable" },
      { status: 502 },
    );
  }
}
