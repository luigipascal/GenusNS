/**
 * Published Genus master only — no Web Audio stand-in.
 * Law / prompts live in `{}`; audio arrives via genus publish → Contabo data.
 */

export type AuditionMode = "master" | "awaiting-master";

export function masterAudioUrl(trackShortId: string): string {
  const id = trackShortId
    .replace(/^genus\/\/ns:/i, "")
    .slice(0, 6)
    .toLowerCase();
  return `/api/audio/${id}`;
}
