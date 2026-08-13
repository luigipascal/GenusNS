import type { ExperimentPalette, GenomeVisualProfile } from "./types";

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpPalette(a: ExperimentPalette, b: ExperimentPalette, t: number): ExperimentPalette {
  const mix = (
    x: { l: number; c: number; h: number },
    y: { l: number; c: number; h: number },
  ) => ({
    l: lerp(x.l, y.l, t),
    c: lerp(x.c, y.c, t),
    h: lerp(x.h, y.h, t),
  });
  const p = mix(a.oklch.primary, b.oklch.primary);
  const s = mix(a.oklch.secondary, b.oklch.secondary);
  return {
    foreground: t < 0.5 ? a.foreground : b.foreground,
    background: t < 0.5 ? a.background : b.background,
    primaryAccent: `oklch(${p.l.toFixed(3)} ${p.c.toFixed(3)} ${p.h.toFixed(1)})`,
    secondaryAccent: `oklch(${s.l.toFixed(3)} ${s.c.toFixed(3)} ${s.h.toFixed(1)})`,
    mutedAccent: t < 0.5 ? a.mutedAccent : b.mutedAccent,
    oklch: { primary: p, secondary: s },
  };
}

/**
 * Visual interpolation between two profiles.
 * Midpoints are presentation only — not valid musical genres.
 */
export function interpolateVisualProfiles(
  a: GenomeVisualProfile,
  b: GenomeVisualProfile,
  tRaw: number,
): GenomeVisualProfile {
  const t = Math.min(1, Math.max(0, tRaw));
  const radialSegments = Math.round(lerp(a.radialSegments, b.radialSegments, t));
  const pulseCount = Math.max(1, Math.round(lerp(a.pulseCount, b.pulseCount, t)));

  // Prefer nearer endpoint's discrete sets
  const near = t < 0.5 ? a : b;
  return {
    ...near,
    seed: `${a.digest}:${b.digest}:${t.toFixed(3)}`,
    digest: near.digest,
    canonicalId: "VISUAL INTERPOLATION",
    radialSegments,
    pulseCount,
    accents: near.accents
      .map((x) => Math.min(pulseCount - 1, Math.round(x * (pulseCount / Math.max(near.pulseCount, 1)))))
      .filter((v, i, arr) => arr.indexOf(v) === i),
    euclideanHits: near.euclideanHits
      .map((x) => Math.min(pulseCount - 1, Math.round(x * (pulseCount / Math.max(near.pulseCount, 1)))))
      .filter((v, i, arr) => arr.indexOf(v) === i),
    allowedDegrees: near.allowedDegrees
      .map((d) =>
        Math.min(
          radialSegments - 1,
          Math.round(d * (radialSegments / Math.max(near.radialSegments, 1))),
        ),
      )
      .filter((v, i, arr) => arr.indexOf(v) === i),
    symmetry: lerp(a.symmetry, b.symmetry, t),
    irregularity: lerp(a.irregularity, b.irregularity, t),
    density: lerp(a.density, b.density, t),
    motionRate: lerp(a.motionRate, b.motionRate, t),
    brightnessBias: lerp(a.brightnessBias, b.brightnessBias, t),
    distortion: lerp(a.distortion, b.distortion, t),
    rotationOffset: lerp(a.rotationOffset, b.rotationOffset, t),
    phase: lerp(a.phase, b.phase, t),
    lineThicknessBias: lerp(a.lineThicknessBias, b.lineThicknessBias, t),
    cameraAzimuth: lerp(a.cameraAzimuth, b.cameraAzimuth, t),
    palette: lerpPalette(a.palette, b.palette, t),
    bpm: lerp(a.bpm, b.bpm, t),
    eventCount: Math.round(lerp(a.eventCount, b.eventCount, t)),
    geometryVariant: near.geometryVariant,
  };
}
