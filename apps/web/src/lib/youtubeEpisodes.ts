export type YoutubeEpisode = {
  id: string;
  title: string;
  publishedAt: string;
};

const CHANNEL_ID =
  process.env.YOUTUBE_CHANNEL_ID?.trim() || "UCfGQ-cBAm7InANUFEZuxi1Q";

function feedUrl(): string {
  const playlist = process.env.YOUTUBE_PODCAST_PLAYLIST_ID?.trim();
  if (playlist) {
    return `https://www.youtube.com/feeds/videos.xml?playlist_id=${encodeURIComponent(playlist)}`;
  }
  return `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(CHANNEL_ID)}`;
}

function decode(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function isDispatchEpisode(title: string): boolean {
  return /dispatch|podcast/i.test(title);
}

function parseEntries(xml: string): YoutubeEpisode[] {
  const out: YoutubeEpisode[] = [];
  const blocks = xml.split("<entry").slice(1);
  for (const block of blocks) {
    const id = /<yt:videoId>\s*([A-Za-z0-9_-]{6,})\s*<\/yt:videoId>/.exec(block)?.[1];
    const titleRaw = /<title>([\s\S]*?)<\/title>/.exec(block)?.[1];
    const published = /<published>([^<]+)<\/published>/.exec(block)?.[1] ?? "";
    if (!id || !titleRaw) continue;
    const title = decode(titleRaw).trim();
    if (!title) continue;
    out.push({ id, title, publishedAt: published });
  }
  return out;
}

/** Public YouTube Atom feed — no API key. Refreshes with the page revalidate. */
export async function listYoutubeEpisodes(): Promise<YoutubeEpisode[]> {
  const playlist = Boolean(process.env.YOUTUBE_PODCAST_PLAYLIST_ID?.trim());
  try {
    const res = await fetch(feedUrl(), {
      next: { revalidate: 300 },
      headers: { Accept: "application/atom+xml,application/xml,text/xml" },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const entries = parseEntries(xml);
    const episodes = playlist
      ? entries
      : entries.filter((e) => isDispatchEpisode(e.title));
    return episodes.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  } catch {
    return [];
  }
}
