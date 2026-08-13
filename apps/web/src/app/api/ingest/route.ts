/**
 * Verify asset hashes from ASSETS.json during ingest.
 * Full multipart upload lands in a follow-up; this endpoint accepts a local snapshot path in Studio/dev.
 */
import { NextResponse } from "next/server";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { resolveExperiment } from "@genusns/genome-visuals";
import { runPublicationPipeline, verifyAssetHashes } from "@genusns/pipeline";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function dataRoot(): string {
  return process.env.GENUSNS_DATA_DIR ?? path.join(process.cwd(), "..", "..", "data");
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    digest?: string;
    snapshotDir?: string;
    audioPath?: string;
    assets?: Array<{ path: string; sha256: string }>;
  };

  if (!body.digest) {
    return NextResponse.json({ error: "digest required" }, { status: 400 });
  }

  const experiment = resolveExperiment(body.digest);
  if (!experiment) {
    return NextResponse.json({ error: "unknown digest / fixture" }, { status: 404 });
  }

  if (body.assets?.length && body.snapshotDir) {
    const check = await verifyAssetHashes(body.assets, body.snapshotDir);
    if (!check.ok) {
      return NextResponse.json(
        { error: "hash_mismatch", failures: check.failures },
        { status: 400 },
      );
    }
  }

  const result = await runPublicationPipeline(experiment, dataRoot(), {
    audioPath: body.audioPath,
    snapshotDir: body.snapshotDir,
  });

  // Record ingest receipt
  const receipt = {
    ...result,
    ingested_at: new Date().toISOString(),
    hash_verified: Boolean(body.assets?.length),
  };
  await import("node:fs/promises").then((fs) =>
    fs.writeFile(
      path.join(dataRoot(), "experiments", experiment.digest, "INGEST.json"),
      JSON.stringify(receipt, null, 2),
      "utf8",
    ),
  );

  return NextResponse.json({
    ok: true,
    ...receipt,
    next: "Upload kit to Ditto Music (manual)",
  });
}

export async function GET() {
  try {
    const raw = await readFile(
      path.join(dataRoot(), "READY_FOR_DITTO", "INDEX.json"),
      "utf8",
    ).catch(() => null);
    return NextResponse.json({
      ingest: "POST digest + optional assets[] + snapshotDir",
      index: raw ? JSON.parse(raw) : null,
    });
  } catch {
    return NextResponse.json({ ingest: "POST digest" });
  }
}
