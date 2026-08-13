/**
 * Deterministic PRNG from experiment digest.
 * Canonical visuals must never use Math.random().
 */

function digestToUint32s(digest: string): [number, number, number, number] {
  const hex = digest.replace(/[^0-9a-f]/gi, "").toLowerCase().padEnd(32, "0").slice(0, 32);
  const words: number[] = [];
  for (let i = 0; i < 4; i++) {
    words.push(Number.parseInt(hex.slice(i * 8, i * 8 + 8), 16) >>> 0);
  }
  return [words[0]!, words[1]!, words[2]!, words[3]!];
}

/** Mulberry32 — fast, deterministic, good enough for visual variation. */
export function createSeededRng(digest: string): () => number {
  let t = digestToUint32s(digest)[0]! || 0x9e3779b9;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function digestBytes(digest: string): number[] {
  const hex = digest.replace(/[^0-9a-f]/gi, "").toLowerCase();
  const out: number[] = [];
  for (let i = 0; i + 1 < hex.length; i += 2) {
    out.push(Number.parseInt(hex.slice(i, i + 2), 16));
  }
  return out;
}

export function floatFromDigest(digest: string, index: number): number {
  const bytes = digestBytes(digest);
  if (bytes.length === 0) return 0;
  const a = bytes[index % bytes.length]!;
  const b = bytes[(index + 1) % bytes.length]!;
  return ((a << 8) | b) / 65535;
}
