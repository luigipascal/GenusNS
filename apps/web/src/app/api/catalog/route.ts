import { NextResponse } from "next/server";
import { listLiveExperiments } from "@/lib/liveCatalog";
import { loadBacklog, loadPublished } from "@/lib/publish";
import { loadSmartLinks } from "@/lib/smartlinks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function shortId(digest: string): string {
  return digest.replace(/[^a-fA-F0-9]/g, "").slice(0, 6).toUpperCase();
}

export async function GET() {
  const [experiments, published, backlog, smartlinks] = await Promise.all([
    listLiveExperiments(),
    loadPublished(),
    loadBacklog(),
    loadSmartLinks(),
  ]);
  const pubById = new Map(published.entries.map((e) => [shortId(e.id), e]));
  const queued = new Set(backlog.queue.map((e) => shortId(e.id)));

  return NextResponse.json({
    count: experiments.length,
    experiments,
    status: Object.fromEntries(
      experiments.map((e) => {
        const id = shortId(e.digest);
        const pub = pubById.get(id);
        return [
          id,
          {
            published: Boolean(pub),
            inBacklog: queued.has(id),
            publishedAt: pub?.publishedAt ?? null,
            smartLink: smartlinks[id]?.url ?? null,
          },
        ];
      }),
    ),
  });
}
