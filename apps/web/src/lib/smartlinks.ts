import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { dataRoot } from "./orders";

export type SmartLinkEntry = {
  url: string;
  source?: string;
  subject?: string;
  capturedAt?: string;
};

export type SmartLinksMap = Record<string, SmartLinkEntry>;

function normId(id: string): string {
  return id.replace(/[^a-fA-F0-9]/gi, "").slice(0, 6).toUpperCase();
}

/** Durable id → Ditto (or other) smart-link mapping written by smartlinks_sync.py */
export async function loadSmartLinks(): Promise<SmartLinksMap> {
  const file = path.join(dataRoot(), "smartlinks.json");
  try {
    await access(file);
    const raw = JSON.parse(await readFile(file, "utf8")) as SmartLinksMap;
    const out: SmartLinksMap = {};
    for (const [k, v] of Object.entries(raw)) {
      const id = normId(k);
      if (id.length === 6 && v?.url) out[id] = v;
    }
    return out;
  } catch {
    return {};
  }
}

export async function smartLinkFor(id: string): Promise<string | null> {
  const map = await loadSmartLinks();
  const hit = map[normId(id)];
  return hit?.url ?? null;
}
