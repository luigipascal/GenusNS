import { createReadStream, statSync } from "node:fs";
import { access, copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { writeCoverPng } from "@genusns/pipeline";
import { dataRoot } from "@/lib/orders";
import { resolveLiveExperiment } from "@/lib/liveCatalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Ctx = { params: Promise<{ id: string }> };

async function existingCover(short: string): Promise<string | null> {
  const root = dataRoot();
  const lower = short.toLowerCase();
  const upper = short.toUpperCase();
  const candidates = [
    path.join(root, "covers", `${lower}.png`),
    path.join(root, "public-covers", `${lower}.png`),
    path.join(root, "READY_FOR_DITTO", upper, "cover.png"),
    path.join(process.cwd(), "public", "covers", `${lower}.png`),
  ];
  for (const file of candidates) {
    try {
      await access(file);
      return file;
    } catch {
      /* next */
    }
  }
  return null;
}

async function stampCover(short: string, coverPath: string): Promise<void> {
  const root = dataRoot();
  const upper = short.toUpperCase();
  const copies = [
    path.join(root, "covers", `${short.toLowerCase()}.png`),
    path.join(root, "READY_FOR_DITTO", upper, "cover.png"),
    path.join(root, "packages", upper, "cover.png"),
  ];
  for (const dest of copies) {
    try {
      await mkdir(path.dirname(dest), { recursive: true });
      if (path.resolve(dest) !== path.resolve(coverPath)) {
        await copyFile(coverPath, dest);
      }
    } catch {
      /* kit folder may not exist yet */
    }
  }
}

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const short = id.replace(/[^a-fA-F0-9]/g, "").slice(0, 6);
  if (short.length < 4) {
    return NextResponse.json({ error: "bad id" }, { status: 400 });
  }

  let file = await existingCover(short);
  if (!file) {
    const experiment = await resolveLiveExperiment(short);
    if (!experiment) {
      return NextResponse.json({ error: "unknown species" }, { status: 404 });
    }
    const coversDir = path.join(dataRoot(), "covers");
    const result = await writeCoverPng(experiment, coversDir);
    file = result.path;
    await stampCover(short, file);
  }

  const stat = statSync(file);
  const stream = createReadStream(file);
  return new NextResponse(Readable.toWeb(stream) as unknown as ReadableStream, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Content-Length": String(stat.size),
      "Cache-Control": "public, max-age=86400",
    },
  });
}

export async function HEAD(req: Request, ctx: Ctx) {
  const res = await GET(req, ctx);
  if (!res.ok) return new NextResponse(null, { status: res.status });
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Content-Type": res.headers.get("Content-Type") ?? "image/png",
      "Content-Length": res.headers.get("Content-Length") ?? "0",
    },
  });
}
