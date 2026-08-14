import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { dataRoot } from "./orders";

export const PUBLISH_MAX_PER_DAY = 1;

export interface PublishEntry {
  id: string;
  digest: string;
  publishedAt: string;
  packageZip?: string;
}

export interface BacklogEntry {
  id: string;
  digest: string;
  readyAt: string;
  packageZip?: string;
}

export interface PublishedState {
  schema: "genusns.publish.v1";
  maxPerDay: number;
  entries: PublishEntry[];
}

export interface BacklogState {
  schema: "genusns.backlog.v1";
  queue: BacklogEntry[];
}

function publishedPath(): string {
  return path.join(dataRoot(), "published.json");
}

function backlogPath(): string {
  return path.join(dataRoot(), "backlog.json");
}

function normId(id: string): string {
  return id.replace(/[^a-fA-F0-9]/gi, "").slice(0, 6).toUpperCase();
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    await access(file);
    return JSON.parse(await readFile(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}

export async function loadPublished(): Promise<PublishedState> {
  return readJson(publishedPath(), {
    schema: "genusns.publish.v1",
    maxPerDay: PUBLISH_MAX_PER_DAY,
    entries: [],
  });
}

export async function loadBacklog(): Promise<BacklogState> {
  return readJson(backlogPath(), {
    schema: "genusns.backlog.v1",
    queue: [],
  });
}

export async function isTrackPublished(id: string): Promise<boolean> {
  const short = normId(id);
  if (short.length < 4) return false;
  const state = await loadPublished();
  return state.entries.some((e) => normId(e.id) === short);
}

export async function trackPublishStatus(id: string): Promise<{
  id: string;
  published: boolean;
  inBacklog: boolean;
  publishedAt?: string;
}> {
  const short = normId(id);
  const [published, backlog] = await Promise.all([
    loadPublished(),
    loadBacklog(),
  ]);
  const pub = published.entries.find((e) => normId(e.id) === short);
  const queued = backlog.queue.some((e) => normId(e.id) === short);
  return {
    id: short,
    published: Boolean(pub),
    inBacklog: queued,
    publishedAt: pub?.publishedAt,
  };
}

/** UTC calendar day key YYYY-MM-DD */
export function utcDay(iso = new Date().toISOString()): string {
  return iso.slice(0, 10);
}

export function publishedTodayCount(state: PublishedState, day = utcDay()): number {
  return state.entries.filter((e) => utcDay(e.publishedAt) === day).length;
}

export async function savePublished(state: PublishedState): Promise<void> {
  await mkdir(dataRoot(), { recursive: true });
  await writeFile(publishedPath(), JSON.stringify(state, null, 2), "utf8");
}

export async function saveBacklog(state: BacklogState): Promise<void> {
  await mkdir(dataRoot(), { recursive: true });
  await writeFile(backlogPath(), JSON.stringify(state, null, 2), "utf8");
}
