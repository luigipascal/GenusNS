import { NextResponse } from "next/server";
import { createReadStream, statSync } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import {
  findOrderByToken,
  resolveTrackAudioPath,
  resolveTrackPackagePath,
  saveOrder,
} from "@/lib/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ token: string }> };

/**
 * Fulfil paid track downloads from Contabo data volume.
 * Prefers buyer package zip (Genus master + raw law materials).
 */
export async function GET(_req: Request, ctx: Ctx) {
  const { token } = await ctx.params;
  if (!token || token.length < 16) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  const order = await findOrderByToken(token);
  if (!order || order.kind !== "track" || !order.trackId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (
    order.downloadExpiresAt &&
    Date.parse(order.downloadExpiresAt) < Date.now()
  ) {
    return NextResponse.json({ error: "Download expired" }, { status: 410 });
  }

  const packagePath = await resolveTrackPackagePath(order.trackId);
  const audioPath = packagePath ?? (await resolveTrackAudioPath(order.trackId));
  if (!audioPath) {
    return NextResponse.json(
      {
        error: "Package not yet on server",
        detail:
          "Paid order recorded. Package (Genus master + raw law materials) will be available once generation finishes on the Contabo data volume.",
        orderId: order.id,
      },
      { status: 409 },
    );
  }

  const maxDownloads = Number(process.env.DOWNLOAD_MAX_COUNT ?? 5);
  const count = order.downloadCount ?? 0;
  if (count >= maxDownloads) {
    return NextResponse.json(
      { error: "Download limit reached" },
      { status: 429 },
    );
  }

  order.downloadCount = count + 1;
  await saveOrder(order);

  const stat = statSync(audioPath);
  const stream = createReadStream(audioPath);
  const webStream = Readable.toWeb(stream) as unknown as ReadableStream;
  const filename = path.basename(audioPath);
  const ext = path.extname(filename).toLowerCase();
  const type =
    ext === ".zip"
      ? "application/zip"
      : ext === ".flac"
        ? "audio/flac"
        : ext === ".mp3"
          ? "audio/mpeg"
          : "audio/wav";

  return new NextResponse(webStream, {
    status: 200,
    headers: {
      "Content-Type": type,
      "Content-Length": String(stat.size),
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
