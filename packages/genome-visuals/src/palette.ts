import { floatFromDigest } from "./seed";
import type { ExperimentPalette } from "./types";

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/**
 * Deterministic experiment accents in bounded OKLCH.
 * Accents are for lines/markers/glyphs — not arbitrary body text.
 * Text uses fixed near-white / near-black for WCAG.
 */
export function createExperimentPalette(digest: string): ExperimentPalette {
  const h1 = floatFromDigest(digest, 0) * 360;
  // Avoid purple→cyan cliché cluster (~250–200 wrap); nudge away from neon chaos
  let hue = h1;
  if (hue > 200 && hue < 290) {
    hue = (hue + 95) % 360;
  }

  const h2 = (hue + 28 + floatFromDigest(digest, 2) * 40) % 360;
  const c1 = clamp(0.06 + floatFromDigest(digest, 3) * 0.08, 0.05, 0.14);
  const c2 = clamp(0.04 + floatFromDigest(digest, 4) * 0.06, 0.03, 0.11);
  const l1 = clamp(0.62 + floatFromDigest(digest, 5) * 0.12, 0.58, 0.74);
  const l2 = clamp(0.48 + floatFromDigest(digest, 6) * 0.1, 0.45, 0.6);

  const primary = `oklch(${l1.toFixed(3)} ${c1.toFixed(3)} ${hue.toFixed(1)})`;
  const secondary = `oklch(${l2.toFixed(3)} ${c2.toFixed(3)} ${h2.toFixed(1)})`;
  const muted = `oklch(0.45 ${Math.min(c1, 0.06).toFixed(3)} ${hue.toFixed(1)})`;

  return {
    foreground: "#e8e6e1",
    background: "#070708",
    primaryAccent: primary,
    secondaryAccent: secondary,
    mutedAccent: muted,
    oklch: {
      primary: { l: l1, c: c1, h: hue },
      secondary: { l: l2, c: c2, h: h2 },
    },
  };
}
