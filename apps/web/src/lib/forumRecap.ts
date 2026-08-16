import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { LEGAL } from "./legal";
import { dataRoot } from "./orders";

export type ForumTopic = {
  title: string;
  replies: number;
  url?: string;
};

export type ForumApplication = {
  title: string;
  url: string;
  genomeId: string;
  kind: string;
  at: string;
};

export type ForumRecap = {
  text: string;
  html: string;
  topics: ForumTopic[];
  applications: ForumApplication[];
};

const FORUM = LEGAL.forumUrl;
const LABEL = LEGAL.forumLabel;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) =>
      String.fromCodePoint(parseInt(h, 16)),
    )
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function parseTopics(html: string): ForumTopic[] {
  const out: ForumTopic[] = [];
  const seen = new Set<string>();
  const card =
    /href="(\/forum\/genus-ns-lab\/([a-z0-9][a-z0-9\-]*))"\s*>(.*?)<\/a>/gis;
  let m: RegExpExecArray | null;
  while ((m = card.exec(html))) {
    const pathPart = m[1] ?? "";
    const blob = m[3] ?? "";
    const hm = /<h2[^>]*>(.*?)<\/h2>/is.exec(blob);
    if (!hm) continue;
    const title = decodeEntities((hm[1] ?? "").replace(/<[^>]+>/g, ""))
      .replace(/\s+/g, " ")
      .trim();
    if (!title || seen.has(title.toLowerCase())) continue;
    if (/genus\/\/ns lab/i.test(title) && title.length < 24) continue;
    seen.add(title.toLowerCase());
    out.push({ title, replies: 0, url: `https://aigents.berta.one${pathPart}` });
    if (out.length >= 8) break;
  }
  if (out.length) return out;
  // Fallback: bare h2 titles (older markup)
  const heading =
    /<h2[^>]*>\s*(?:<a[^>]*>)?([^<]{8,160})(?:<\/a>)?\s*<\/h2>/gi;
  while ((m = heading.exec(html))) {
    const title = (m[1] ?? "").replace(/\s+/g, " ").trim();
    if (!title || seen.has(title.toLowerCase())) continue;
    if (/genus\/\/ns lab/i.test(title) && title.length < 24) continue;
    seen.add(title.toLowerCase());
    out.push({ title, replies: 0 });
    if (out.length >= 8) break;
  }
  return out;
}

async function loadApplications(days = 7): Promise<ForumApplication[]> {
  const file = path.join(dataRoot(), "forum_ideas.json");
  try {
    await access(file);
    const raw = JSON.parse(await readFile(file, "utf8")) as {
      ideas?: Array<{
        title?: string;
        url?: string;
        applications?: Array<{
          genomeId?: string;
          kind?: string;
          at?: string;
          forumTitle?: string;
          forumUrl?: string;
        }>;
      }>;
    };
    const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 19) + "Z";
    const out: ForumApplication[] = [];
    for (const idea of raw.ideas ?? []) {
      for (const a of idea.applications ?? []) {
        const at = a.at ?? "";
        if (at < since) continue;
        out.push({
          title: idea.title || a.forumTitle || "forum idea",
          url: idea.url || a.forumUrl || FORUM,
          genomeId: (a.genomeId || "?").toUpperCase(),
          kind: a.kind || "process",
          at,
        });
      }
    }
    out.sort((a, b) => b.at.localeCompare(a.at));
    return out.slice(0, 12);
  } catch {
    return [];
  }
}

function compose(
  topics: ForumTopic[],
  applications: ForumApplication[],
  fetched: boolean,
): ForumRecap {
  const absorbIntro =
    "FROM THE FORUM — USED IN EXPERIMENTS — agents absorbed public lab threads into process/packaging (locked compose prompts unchanged). Every line below is forum-derived work.";
  let absorbBody: string;
  if (!applications.length) {
    absorbBody =
      "No forum ideas were stamped onto genomes this week. Debate continues on the lab board; agents will absorb when matches appear.";
  } else {
    absorbBody = applications
      .map(
        (a, i) =>
          `${i + 1}. [${a.genomeId}] ${a.kind}: ${a.title} → ${a.url}`,
      )
      .join("\n");
  }

  const intro =
    "LAB THIS WEEK — the same agents read the public GENUS//NS AIgents Forum and recap what was debated. Nothing private; titles only.";
  let body: string;
  if (!fetched) {
    body =
      "The lab page could not be read this week. The forum is still open.";
  } else if (!topics.length) {
    body =
      "No public threads were listed on the lab board this week. The forum is open.";
  } else {
    body = topics.map((t, i) => `${i + 1}. ${t.title}`).join("\n");
  }

  const text = [
    absorbIntro,
    absorbBody,
    `Join ${LABEL}: ${FORUM}`,
    "",
    intro,
    body,
    `Join ${LABEL}: ${FORUM}`,
  ].join("\n");

  const appItems = applications
    .map(
      (a) =>
        `<tr><td style="padding:6px 0;font-size:14px;line-height:1.45;"><span style="font-family:Consolas,monospace;color:#c45c32;">${escapeHtml(a.genomeId)}</span> · ${escapeHtml(a.kind)} · <a href="${escapeHtml(a.url)}" style="color:#e8e4d8;">${escapeHtml(a.title)}</a></td></tr>`,
    )
    .join("");
  const items = topics
    .map(
      (t) =>
        `<tr><td style="padding:6px 0;font-size:14px;line-height:1.45;">${escapeHtml(t.title)}</td></tr>`,
    )
    .join("");

  const html = `<tr><td style="padding-top:22px;font-family:Consolas,monospace;font-size:11px;letter-spacing:0.16em;color:#c45c32;">FROM THE FORUM — USED IN EXPERIMENTS</td></tr>
<tr><td style="padding-top:8px;font-size:15px;line-height:1.6;">${escapeHtml(absorbIntro)}</td></tr>
<tr><td style="padding-top:10px;"><table role="presentation" width="100%">${appItems || `<tr><td style="font-size:15px;line-height:1.6;">${escapeHtml(absorbBody)}</td></tr>`}</table></td></tr>
<tr><td style="padding-top:12px;"><a href="${FORUM}" style="font-family:Consolas,monospace;font-size:12px;letter-spacing:0.14em;color:#c45c32;">${escapeHtml(LABEL)}</a></td></tr>
<tr><td style="padding-top:22px;font-family:Consolas,monospace;font-size:11px;letter-spacing:0.16em;color:#c45c32;">LAB THIS WEEK</td></tr>
<tr><td style="padding-top:8px;font-size:15px;line-height:1.6;">${escapeHtml(intro)}</td></tr>
<tr><td style="padding-top:10px;"><table role="presentation" width="100%">${items || `<tr><td style="font-size:15px;line-height:1.6;">${escapeHtml(body)}</td></tr>`}</table></td></tr>
<tr><td style="padding-top:12px;"><a href="${FORUM}" style="font-family:Consolas,monospace;font-size:12px;letter-spacing:0.14em;color:#c45c32;">${escapeHtml(LABEL)}</a></td></tr>`;
  return { text, html, topics, applications };
}

/** Public forum recap + forum-derived experiment credits for the Saturday bulletin. */
export async function fetchForumRecap(): Promise<ForumRecap> {
  const applications = await loadApplications(7);
  try {
    const res = await fetch(FORUM, {
      headers: {
        accept: "text/html",
        "user-agent": "GenusNS-newsletter/1.0 (+https://genusns.com)",
      },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return compose([], applications, false);
    const page = await res.text();
    return compose(parseTopics(page), applications, true);
  } catch {
    return compose([], applications, false);
  }
}
