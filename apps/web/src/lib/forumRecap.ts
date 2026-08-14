import { LEGAL } from "./legal";

export type ForumTopic = {
  title: string;
  replies: number;
};

export type ForumRecap = {
  text: string;
  html: string;
  topics: ForumTopic[];
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

function parseTopics(html: string): ForumTopic[] {
  const out: ForumTopic[] = [];
  const seen = new Set<string>();
  const heading =
    /<h2[^>]*>\s*(?:<a[^>]*>)?([^<]{8,160})(?:<\/a>)?\s*<\/h2>/gi;
  let m: RegExpExecArray | null;
  while ((m = heading.exec(html))) {
    const title = m[1].replace(/\s+/g, " ").trim();
    if (!title || seen.has(title.toLowerCase())) continue;
    if (/genus\/\/ns lab/i.test(title) && title.length < 24) continue;
    seen.add(title.toLowerCase());
    out.push({ title, replies: 0 });
    if (out.length >= 8) break;
  }
  return out;
}

function compose(topics: ForumTopic[], fetched: boolean): ForumRecap {
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
    intro,
    body,
    `Join ${LABEL}: ${FORUM}`,
  ].join("\n");
  const items = topics
    .map(
      (t) =>
        `<tr><td style="padding:6px 0;font-size:14px;line-height:1.45;">${escapeHtml(t.title)}</td></tr>`,
    )
    .join("");
  const html = `<tr><td style="padding-top:22px;font-family:Consolas,monospace;font-size:11px;letter-spacing:0.16em;color:#c45c32;">LAB THIS WEEK</td></tr>
<tr><td style="padding-top:8px;font-size:15px;line-height:1.6;">${escapeHtml(intro)}</td></tr>
<tr><td style="padding-top:10px;"><table role="presentation" width="100%">${items || `<tr><td style="font-size:15px;line-height:1.6;">${escapeHtml(body)}</td></tr>`}</table></td></tr>
<tr><td style="padding-top:12px;"><a href="${FORUM}" style="font-family:Consolas,monospace;font-size:12px;letter-spacing:0.14em;color:#c45c32;">${escapeHtml(LABEL)}</a></td></tr>`;
  return { text, html, topics };
}

/** Public forum recap for the Saturday bulletin. Failures become a short note + link. */
export async function fetchForumRecap(): Promise<ForumRecap> {
  try {
    const res = await fetch(FORUM, {
      headers: {
        accept: "text/html",
        "user-agent": "GenusNS-newsletter/1.0 (+https://genusns.com)",
      },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return compose([], false);
    const page = await res.text();
    return compose(parseTopics(page), true);
  } catch {
    return compose([], false);
  }
}
