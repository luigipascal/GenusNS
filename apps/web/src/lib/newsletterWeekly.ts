import { access, appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { dataRoot } from "./orders";
import { loadPublished, type PublishEntry } from "./publish";
import { AGENT_DISCLOSURE } from "./newsletterWelcome";

const SITE = "https://genusns.com";

export type PublicSpecies = {
  id: string;
  date: string;
  url: string;
};

function isoWeekKey(d: Date): string {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function weekKey(now = new Date()): string {
  return isoWeekKey(now);
}

function stripEntry(e: PublishEntry): PublicSpecies {
  const id = e.id.replace(/[^a-fA-F0-9]/gi, "").slice(0, 6).toUpperCase();
  const date = (e.publishedAt || "").slice(0, 10);
  return { id, date, url: `${SITE}/g/${id}` };
}

export async function publicCatalogue(): Promise<{
  total: number;
  entries: PublicSpecies[];
}> {
  const pub = await loadPublished();
  const entries = pub.entries
    .map(stripEntry)
    .filter((e) => e.id.length === 6)
    .sort((a, b) => a.date.localeCompare(b.date));
  return { total: entries.length, entries };
}

export async function speciesSince(days: number, now = new Date()): Promise<PublicSpecies[]> {
  const since = new Date(now.getTime() - days * 86400000).toISOString().slice(0, 10);
  const { entries } = await publicCatalogue();
  return entries.filter((e) => e.date >= since);
}

export async function speciesOnUtcDay(day: string): Promise<PublicSpecies[]> {
  const { entries } = await publicCatalogue();
  return entries.filter((e) => e.date === day);
}

export function assembleWeeklyHtml(
  week: string,
  recent: PublicSpecies[],
  total: number,
  rangeStart: string,
  rangeEnd: string,
): { subject: string; html: string; text: string } {
  const subject = `GENUS//NS week ${week} — agent bulletin`;
  const disc = AGENT_DISCLOSURE;
  const lead = recent.length
    ? `${recent.length} species went public on the registry between ${rangeStart} and ${rangeEnd} UTC.`
    : `No new species entered the public registry between ${rangeStart} and ${rangeEnd} UTC. The catalogue is unchanged this week.`;
  const lines = recent.map(
    (e) => `- ${e.id} · ${e.date} · ${e.url}`,
  );
  const text = [
    "GENUS//NS",
    disc,
    "",
    lead,
    "",
    ...lines,
    "",
    `Public catalogue size: ${total} species.`,
    `Registry: ${SITE}`,
    "",
    disc,
  ].join("\n");

  const rows = recent
    .map(
      (e) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #3a372f;"><a href="${e.url}" style="color:#e8e4d8;text-decoration:none;"><span style="font-family:Consolas,monospace;color:#c45c32;">${e.id}</span></a> · ${e.date}</td></tr>`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#11110f;color:#e8e4d8;font-family:Georgia,serif;">
<table role="presentation" width="100%"><tr><td align="center" style="padding:28px 16px;">
<table role="presentation" width="560" style="max-width:560px;width:100%;">
<tr><td style="font-family:Consolas,monospace;font-size:11px;letter-spacing:0.22em;color:#c45c32;">GENUS//NS · WEEK ${week}</td></tr>
<tr><td style="padding:16px 0;border-top:1px solid #3a372f;border-bottom:1px solid #3a372f;font-family:Consolas,monospace;font-size:12px;line-height:1.55;color:#e0b59a;">${disc}</td></tr>
<tr><td style="padding-top:20px;font-size:16px;line-height:1.55;">${lead}</td></tr>
<tr><td style="padding-top:16px;"><table role="presentation" width="100%">${rows}</table></td></tr>
<tr><td style="padding-top:18px;font-size:14px;color:#9a9588;">Public catalogue: ${total} species.</td></tr>
<tr><td style="padding-top:16px;"><a href="${SITE}" style="font-family:Consolas,monospace;font-size:12px;letter-spacing:0.14em;color:#c45c32;">GENUSNS.COM</a></td></tr>
<tr><td style="padding-top:28px;font-family:Consolas,monospace;font-size:11px;line-height:1.5;color:#9a9588;">${disc}</td></tr>
</table></td></tr></table>
</body></html>`;
  return { subject, html, text };
}

function logPath(): string {
  return path.join(dataRoot(), "newsletter_log.jsonl");
}

export async function alreadySentWeek(week: string): Promise<boolean> {
  try {
    await access(logPath());
    const raw = await readFile(logPath(), "utf8");
    return raw.split("\n").some((line) => {
      try {
        const row = JSON.parse(line) as { week?: string; ok?: boolean };
        return row.week === week && row.ok;
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}

export async function sendWeeklyCampaign(opts: {
  force?: boolean;
  now?: Date;
}): Promise<{
  sent: boolean;
  week: string;
  count: number;
  campaignId?: number;
  skipped?: string;
}> {
  const now = opts.now ?? new Date();
  const week = weekKey(now);
  if (!opts.force && (await alreadySentWeek(week))) {
    return { sent: false, week, count: 0, skipped: "already sent this ISO week" };
  }
  const apiKey = process.env.BREVO_API_KEY?.trim();
  const listId = Number(process.env.BREVO_NEWSLETTER_LIST_ID);
  const from = process.env.BREVO_FROM_EMAIL?.trim() || "genusns@genusns.com";
  const fromName = process.env.BREVO_FROM_NAME?.trim() || "GENUS//NS";
  if (!apiKey || !Number.isInteger(listId) || listId <= 0) {
    throw new Error("BREVO_API_KEY / BREVO_NEWSLETTER_LIST_ID missing");
  }
  const { total } = await publicCatalogue();
  const recent = await speciesSince(7, now);
  const rangeEnd = now.toISOString().slice(0, 10);
  const rangeStart = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10);
  const letter = assembleWeeklyHtml(week, recent, total, rangeStart, rangeEnd);

  const created = await fetch("https://api.brevo.com/v3/emailCampaigns", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      name: `GENUS//NS ${week}`,
      subject: letter.subject,
      sender: { name: fromName, email: from },
      type: "classic",
      htmlContent: letter.html,
      recipients: { listIds: [listId] },
      inlineImageActivation: false,
    }),
  });
  if (!created.ok) {
    throw new Error(`Brevo campaign create ${created.status}: ${(await created.text()).slice(0, 400)}`);
  }
  const body = (await created.json()) as { id: number };
  const send = await fetch(
    `https://api.brevo.com/v3/emailCampaigns/${body.id}/sendNow`,
    {
      method: "POST",
      headers: {
        "api-key": apiKey,
        accept: "application/json",
      },
    },
  );
  if (!send.ok && send.status !== 204) {
    throw new Error(`Brevo sendNow ${send.status}: ${(await send.text()).slice(0, 400)}`);
  }
  await mkdir(dataRoot(), { recursive: true });
  await appendFile(
    logPath(),
    `${JSON.stringify({
      ok: true,
      week,
      campaignId: body.id,
      count: recent.length,
      at: now.toISOString(),
    })}\n`,
    "utf8",
  );
  return { sent: true, week, count: recent.length, campaignId: body.id };
}
