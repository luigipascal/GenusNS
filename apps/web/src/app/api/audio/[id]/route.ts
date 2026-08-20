import { NextResponse } from "next/server";
import { createReadStream, statSync } from "node:fs";
import { access, readdir } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { MIN_MASTER_BYTES, resolveTrackAudioPath } from "@/lib/orders";
import { isTrackPublished } from "@/lib/publish";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

async function locateAudio(id: string): Promise<string | null> {
  const short = id.replace(/[^a-fA-F0-9]/g, "").slice(0, 6);
  if (short.length < 4) return null;

  // One public release per day — backlog masters stay off LISTEN until published.
  if (!(await isTrackPublished(short))) return null;

  let audioPath = await resolveTrackAudioPath(short);
  if (audioPath) return audioPath;

  const publicDirs = [
    path.join(process.cwd(), "public", "audio"),
    path.join(process.cwd(), "apps", "web", "public", "audio"),
  ];
  for (const publicDir of publicDirs) {
    try {
      const files = await readdir(publicDir);
      const match = files.find((f) =>
        f.toLowerCase().startsWith(short.toLowerCase()),
      );
      if (match) {
        const p = path.join(publicDir, match);
        await access(p);
        if (statSync(p).size < MIN_MASTER_BYTES) continue;
        return p;
      }
    } catch {
      /* try next */
    }
  }
  return null;
}

function contentType(audioPath: string): string {
  const ext = path.extname(audioPath).toLowerCase();
  if (ext === ".mp3") return "audio/mpeg";
  if (ext === ".flac") return "audio/flac";
  if (ext === ".ogg") return "audio/ogg";
  return "audio/wav";
}

/**
 * Stream published master from Contabo data volume (or public/audio in dev).
 */
export async function HEAD(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const audioPath = await locateAudio(id);
  if (!audioPath) {
    return new NextResponse(null, { status: 404 });
  }
  const stat = statSync(audioPath);
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Content-Type": contentType(audioPath),
      "Content-Length": String(stat.size),
      "Accept-Ranges": "bytes",
    },
  });
}

export async function GET(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const audioPath = await locateAudio(id);
  if (!audioPath) {
    return NextResponse.json(
      {
        error: "Audio not found",
        hint: "Place master at data/masters/<ID>.wav or READY_FOR_DITTO/<ID>/audio/ or public/audio/<id>.mp3",
      },
      { status: 404 },
    );
  }

  const stat = statSync(audioPath);
  const type = contentType(audioPath);
  const range = req.headers.get("range");

  if (range) {
    const m = /bytes=(\d+)-(\d*)/.exec(range);
    if (m) {
      const start = Number(m[1]);
      const end = m[2]
        ? Number(m[2])
        : Math.min(start + 1024 * 1024 - 1, stat.size - 1);
      const chunk = end - start + 1;
      const stream = createReadStream(audioPath, { start, end });
      return new NextResponse(
        Readable.toWeb(stream) as unknown as ReadableStream,
        {
          status: 206,
          headers: {
            "Content-Range": `bytes ${start}-${end}/${stat.size}`,
            "Accept-Ranges": "bytes",
            "Content-Length": String(chunk),
            "Content-Type": type,
            "Cache-Control": "public, max-age=3600",
          },
        },
      );
    }
  }

  const stream = createReadStream(audioPath);
  return new NextResponse(Readable.toWeb(stream) as unknown as ReadableStream, {
    status: 200,
    headers: {
      "Content-Type": type,
      "Content-Length": String(stat.size),
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

