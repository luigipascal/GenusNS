import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile, access, readdir } from "node:fs/promises";
import path from "node:path";

export type OrderKind = "service" | "track";

export interface CommerceOrder {
  id: string;
  schema: "genusns.order.v1";
  kind: OrderKind;
  status: "pending" | "paid" | "fulfilled" | "failed";
  createdAt: string;
  paidAt?: string;
  fulfilledAt?: string;
  stripeSessionId: string;
  stripePaymentIntentId?: string | null;
  customerEmail?: string | null;
  amountTotal?: number | null;
  currency?: string | null;
  serviceId?: string;
  trackId?: string;
  downloadToken?: string;
  downloadExpiresAt?: string;
  downloadCount?: number;
  notes?: string;
  metadata?: Record<string, string>;
}

export function dataRoot(): string {
  return (
    process.env.GENUSNS_DATA_DIR ??
    path.join(process.cwd(), "..", "..", "data")
  );
}

function ordersDir(): string {
  return path.join(dataRoot(), "orders");
}

export async function ensureOrdersDir(): Promise<string> {
  const dir = ordersDir();
  await mkdir(dir, { recursive: true });
  await mkdir(path.join(dir, "by-session"), { recursive: true });
  await mkdir(path.join(dir, "by-token"), { recursive: true });
  return dir;
}

export function newOrderId(): string {
  return `ord_${randomBytes(8).toString("hex")}`;
}

export function newDownloadToken(): string {
  return randomBytes(24).toString("base64url");
}

async function writeOrder(order: CommerceOrder): Promise<void> {
  await ensureOrdersDir();
  const file = path.join(ordersDir(), `${order.id}.json`);
  await writeFile(file, JSON.stringify(order, null, 2), "utf8");
  await writeFile(
    path.join(ordersDir(), "by-session", `${order.stripeSessionId}.json`),
    JSON.stringify({ orderId: order.id }, null, 2),
    "utf8",
  );
  if (order.downloadToken) {
    await writeFile(
      path.join(ordersDir(), "by-token", `${order.downloadToken}.json`),
      JSON.stringify({ orderId: order.id }, null, 2),
      "utf8",
    );
  }
}

export async function saveOrder(order: CommerceOrder): Promise<void> {
  await writeOrder(order);
}

export async function readOrder(orderId: string): Promise<CommerceOrder | null> {
  try {
    const raw = await readFile(
      path.join(ordersDir(), `${orderId}.json`),
      "utf8",
    );
    return JSON.parse(raw) as CommerceOrder;
  } catch {
    return null;
  }
}

export async function findOrderBySession(
  sessionId: string,
): Promise<CommerceOrder | null> {
  try {
    const raw = await readFile(
      path.join(ordersDir(), "by-session", `${sessionId}.json`),
      "utf8",
    );
    const { orderId } = JSON.parse(raw) as { orderId: string };
    return readOrder(orderId);
  } catch {
    return null;
  }
}

export async function findOrderByToken(
  token: string,
): Promise<CommerceOrder | null> {
  try {
    const raw = await readFile(
      path.join(ordersDir(), "by-token", `${token}.json`),
      "utf8",
    );
    const { orderId } = JSON.parse(raw) as { orderId: string };
    return readOrder(orderId);
  } catch {
    return null;
  }
}

export async function upsertPaidOrder(input: {
  sessionId: string;
  paymentIntentId?: string | null;
  customerEmail?: string | null;
  amountTotal?: number | null;
  currency?: string | null;
  metadata: Record<string, string>;
}): Promise<CommerceOrder> {
  const existing = await findOrderBySession(input.sessionId);
  const kind = (input.metadata.kind as OrderKind) || "service";
  const now = new Date().toISOString();

  const order: CommerceOrder = existing ?? {
    id: newOrderId(),
    schema: "genusns.order.v1",
    kind,
    status: "paid",
    createdAt: now,
    stripeSessionId: input.sessionId,
    serviceId: input.metadata.serviceId,
    trackId: input.metadata.trackId,
    metadata: input.metadata,
  };

  order.status = "paid";
  order.paidAt = now;
  order.stripePaymentIntentId =
    input.paymentIntentId ?? order.stripePaymentIntentId;
  order.customerEmail = input.customerEmail ?? order.customerEmail;
  order.amountTotal = input.amountTotal ?? order.amountTotal;
  order.currency = input.currency ?? order.currency;
  order.kind = kind;
  order.serviceId = input.metadata.serviceId ?? order.serviceId;
  order.trackId = input.metadata.trackId ?? order.trackId;
  order.metadata = { ...order.metadata, ...input.metadata };

  if (kind === "track" && !order.downloadToken) {
    order.downloadToken = newDownloadToken();
    const days = Number(process.env.DOWNLOAD_TOKEN_DAYS ?? 7);
    order.downloadExpiresAt = new Date(
      Date.now() + days * 24 * 60 * 60 * 1000,
    ).toISOString();
    order.downloadCount = 0;
    order.status = "fulfilled";
    order.fulfilledAt = now;
    order.notes =
      "Track download token issued. File served from Contabo data volume when present.";
  } else if (kind === "service") {
    order.notes =
      order.notes ??
      "Service paid. Fulfilment is manual by Neural Syntax / 0dB_Labs.";
  }

  await writeOrder(order);
  return order;
}

/** Resolve master audio path for a track short id (e.g. 288fbd). */
export async function resolveTrackAudioPath(
  trackId: string,
): Promise<string | null> {
  const short = trackId.replace(/^genus\/\/ns:/i, "").slice(0, 6).toUpperCase();
  const candidates = [
    path.join(dataRoot(), "READY_FOR_DITTO", short, "audio", "master.wav"),
    path.join(dataRoot(), "READY_FOR_DITTO", short, "audio", "master.flac"),
    path.join(dataRoot(), "masters", `${short}.wav`),
    path.join(dataRoot(), "masters", `${short.toLowerCase()}.wav`),
  ];
  for (const file of candidates) {
    try {
      await access(file);
      return file;
    } catch {
      /* try next */
    }
  }
  try {
    const dir = path.join(dataRoot(), "READY_FOR_DITTO", short, "audio");
    const files = await readdir(dir);
    const audio = files.find((f) => /\.(wav|flac|aiff|mp3)$/i.test(f));
    if (audio) return path.join(dir, audio);
  } catch {
    /* none */
  }
  return null;
}

export function orderPublicSummary(order: CommerceOrder) {
  return {
    id: order.id,
    kind: order.kind,
    status: order.status,
    trackId: order.trackId ?? null,
    serviceId: order.serviceId ?? null,
    downloadAvailable: Boolean(order.downloadToken),
    downloadUrl: order.downloadToken
      ? `/api/download/${order.downloadToken}`
      : null,
    downloadExpiresAt: order.downloadExpiresAt ?? null,
    email: order.customerEmail ?? null,
  };
}

export function fingerprintPayload(payload: string): string {
  return createHash("sha256").update(payload).digest("hex").slice(0, 16);
}
