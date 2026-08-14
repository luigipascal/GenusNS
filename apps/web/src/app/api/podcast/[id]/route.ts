import { NextResponse } from "next/server";
import { createReadStream, existsSync, statSync } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { dataRoot } from "@/lib/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const ALLOWED = new Set(["ep001-00d88e"]);

function locate(id: string): string | null {
  const slug = id.replace(/[^a-zA-Z0-9_-]/g, "").toLowerCase();
  if (!ALLOWED.has(slug)) return null;
  const file = path.join(dataRoot(), "podcast", `${slug}.mp3`);
  if (!existsSync(file)) return null;
  return file;
}

export async function HEAD(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const audioPath = locate(id);
  if (!audioPath) return new NextResponse(null, { status: 404 });
  const stat = statSync(audioPath);
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Content-Length": String(stat.size),
      "Accept-Ranges": "bytes",
    },
  });
}

export async function GET(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const audioPath = locate(id);
  if (!audioPath) {
    return NextResponse.json({ error: "Episode audio not found" }, { status: 404 });
  }
  const stat = statSync(audioPath);
  const range = req.headers.get("range");
  if (range) {
    const m = /bytes=(\d+)-(\d*)/.exec(range);
    if (m) {
      const start = Number(m[1]);
      const end = m[2] ? Number(m[2]) : Math.min(start + 1024 * 1024 - 1, stat.size - 1);
      const chunk = end - start + 1;
      const stream = createReadStream(audioPath, { start, end });
      return new NextResponse(Readable.toWeb(stream) as unknown as ReadableStream, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${stat.size}`,
          "Accept-Ranges": "bytes",
          "Content-Length": String(chunk),
          "Content-Type": "audio/mpeg",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }
  }
  const stream = createReadStream(audioPath);
  return new NextResponse(Readable.toWeb(stream) as unknown as ReadableStream, {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Content-Length": String(stat.size),
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
