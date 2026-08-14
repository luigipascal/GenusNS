import { NextResponse } from "next/server";
import { createReadStream, existsSync, statSync } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { dataRoot } from "@/lib/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const ALLOWED = new Set(["ep001-00d88e"]);

function locate(id: string): { file: string; type: string } | null {
  const slug = id.replace(/[^a-zA-Z0-9_-]/g, "").toLowerCase();
  if (!ALLOWED.has(slug)) return null;
  const dir = path.join(dataRoot(), "podcast");
  const mp4 = path.join(dir, `${slug}.mp4`);
  if (existsSync(mp4)) return { file: mp4, type: "video/mp4" };
  const mp3 = path.join(dir, `${slug}.mp3`);
  if (existsSync(mp3)) return { file: mp3, type: "audio/mpeg" };
  return null;
}

export async function HEAD(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const hit = locate(id);
  if (!hit) return new NextResponse(null, { status: 404 });
  const stat = statSync(hit.file);
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Content-Type": hit.type,
      "Content-Length": String(stat.size),
      "Accept-Ranges": "bytes",
    },
  });
}

export async function GET(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const hit = locate(id);
  if (!hit) {
    return NextResponse.json({ error: "Episode not found" }, { status: 404 });
  }
  const stat = statSync(hit.file);
  const range = req.headers.get("range");
  if (range) {
    const m = /bytes=(\d+)-(\d*)/.exec(range);
    if (m) {
      const start = Number(m[1]);
      const end = m[2]
        ? Number(m[2])
        : Math.min(start + 2 * 1024 * 1024 - 1, stat.size - 1);
      const chunk = end - start + 1;
      const stream = createReadStream(hit.file, { start, end });
      return new NextResponse(
        Readable.toWeb(stream) as unknown as ReadableStream,
        {
          status: 206,
          headers: {
            "Content-Range": `bytes ${start}-${end}/${stat.size}`,
            "Accept-Ranges": "bytes",
            "Content-Length": String(chunk),
            "Content-Type": hit.type,
            "Cache-Control": "public, max-age=3600",
          },
        },
      );
    }
  }
  const stream = createReadStream(hit.file);
  return new NextResponse(Readable.toWeb(stream) as unknown as ReadableStream, {
    status: 200,
    headers: {
      "Content-Type": hit.type,
      "Content-Length": String(stat.size),
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
