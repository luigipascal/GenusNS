import type { GenomeVisualProfile } from "./types";

export interface ProjectionOptions {
  size?: number;
  width?: number;
  height?: number;
  className?: string;
}

function polar(cx: number, cy: number, r: number, angle: number) {
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

export interface RhythmOrbitOptions extends ProjectionOptions {
  /** Active cycle step during playback (0..pulseCount-1). */
  activeStep?: number | null;
  /** 0..1 phase within the current step. */
  stepPhase?: number;
}

/** Cycle orbit: positions = pulseCount; Euclid + accents marked. */
export function renderRhythmOrbitSvg(
  profile: GenomeVisualProfile,
  options: RhythmOrbitOptions = {},
): string {
  const size = options.size ?? 280;
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.36;
  const rot = -Math.PI / 2;
  const { palette } = profile;
  const parts: string[] = [
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${palette.mutedAccent}" stroke-width="1" opacity="0.4"/>`,
  ];

  for (let i = 0; i < profile.pulseCount; i++) {
    const a = rot + (i / profile.pulseCount) * Math.PI * 2;
    const p = polar(cx, cy, r, a);
    const accent = profile.accents.includes(i);
    const euclid = profile.euclideanHits.includes(i);
    const active = options.activeStep === i;
    if (accent) {
      parts.push(
        `<circle cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="${active ? 9 : 7}" fill="${palette.primaryAccent}" opacity="${active ? 1 : 0.95}"/>`,
        `<text x="${p.x.toFixed(2)}" y="${(p.y + 3).toFixed(2)}" text-anchor="middle" font-size="8" fill="${palette.background}" font-family="ui-monospace, monospace">${i}</text>`,
      );
    } else if (euclid) {
      parts.push(
        `<circle cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="${active ? 6.5 : 5}" fill="none" stroke="${palette.secondaryAccent}" stroke-width="${active ? 2.2 : 1.5}"/>`,
        `<text x="${p.x.toFixed(2)}" y="${(p.y - 12).toFixed(2)}" text-anchor="middle" font-size="8" fill="${palette.secondaryAccent}" font-family="ui-monospace, monospace">${i}</text>`,
      );
    } else {
      parts.push(
        `<circle cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="${active ? 4 : 2.5}" fill="${palette.foreground}" opacity="${active ? 0.9 : 0.35}"/>`,
      );
    }
  }

  if (options.activeStep != null && profile.pulseCount > 0) {
    const phase = options.stepPhase ?? 0;
    const a =
      rot +
      ((options.activeStep + phase) / profile.pulseCount) * Math.PI * 2;
    const tip = polar(cx, cy, r * 0.72, a);
    parts.push(
      `<line x1="${cx}" y1="${cy}" x2="${tip.x.toFixed(2)}" y2="${tip.y.toFixed(2)}" stroke="${palette.primaryAccent}" stroke-width="1.25" opacity="0.75"/>`,
      `<circle cx="${tip.x.toFixed(2)}" cy="${tip.y.toFixed(2)}" r="3" fill="${palette.primaryAccent}"/>`,
    );
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="Rhythm orbit cycle ${profile.pulseCount}"${options.className ? ` class="${options.className}"` : ""}>${parts.join("")}</svg>`;
}

/** EDO pitch lattice — all degrees; allowed active; cents on hover via title. */
export function renderPitchLatticeSvg(
  profile: GenomeVisualProfile,
  options: ProjectionOptions & { tonicHz?: number } = {},
): string {
  const size = options.size ?? 320;
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;
  const rot = -Math.PI / 2;
  const { palette } = profile;
  const edo = profile.radialSegments;
  const parts: string[] = [
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${palette.mutedAccent}" stroke-width="1" opacity="0.3"/>`,
  ];

  for (let d = 0; d < edo; d++) {
    const a = rot + (d / edo) * Math.PI * 2;
    const p = polar(cx, cy, r, a);
    const allowed = profile.allowedDegrees.includes(d);
    const cents = ((1200 * d) / edo).toFixed(1);
    if (allowed) {
      parts.push(
        `<circle cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="4.5" fill="${palette.primaryAccent}"><title>degree ${d} · ${cents} cents</title></circle>`,
      );
    } else {
      parts.push(
        `<circle cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="2" fill="${palette.foreground}" opacity="0.12"><title>degree ${d} · ghost</title></circle>`,
      );
    }
  }

  parts.push(
    `<text x="${cx}" y="${cy + 4}" text-anchor="middle" font-size="11" fill="${palette.foreground}" opacity="0.5" font-family="ui-monospace, monospace">${edo}-EDO</text>`,
  );

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="Pitch lattice ${edo}-EDO"${options.className ? ` class="${options.className}"` : ""}>${parts.join("")}</svg>`;
}

/** Restrained weighted digraph of form nodes. */
export function renderFormGraphSvg(
  profile: GenomeVisualProfile,
  options: ProjectionOptions = {},
): string {
  const w = options.width ?? 360;
  const h = options.height ?? 220;
  const { palette, formNodes, graphEdges } = profile;
  const n = formNodes.length;
  const positions = new Map<string, { x: number; y: number }>();
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
    positions.set(formNodes[i]!, {
      x: w / 2 + Math.cos(a) * (Math.min(w, h) * 0.32),
      y: h / 2 + Math.sin(a) * (Math.min(w, h) * 0.32),
    });
  }

  const parts: string[] = [];
  for (const e of graphEdges) {
    const a = positions.get(e.from);
    const b = positions.get(e.to);
    if (!a || !b) continue;
    parts.push(
      `<line x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}" stroke="${palette.secondaryAccent}" stroke-width="${(0.5 + e.weight * 2).toFixed(2)}" opacity="${(0.25 + e.weight * 0.55).toFixed(2)}"/>`,
    );
  }
  for (const name of formNodes) {
    const p = positions.get(name)!;
    parts.push(
      `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4" fill="${palette.primaryAccent}"/>`,
      `<text x="${p.x.toFixed(1)}" y="${(p.y - 10).toFixed(1)}" text-anchor="middle" font-size="10" fill="${palette.foreground}" font-family="ui-monospace, monospace">${name}</text>`,
    );
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="Form graph"${options.className ? ` class="${options.className}"` : ""}>${parts.join("")}</svg>`;
}

/** Abstract spectral surface from centroid / inharmonicity / roughness. */
export function renderSpectralSurfaceSvg(
  profile: GenomeVisualProfile,
  options: ProjectionOptions = {},
): string {
  const w = options.width ?? 400;
  const h = options.height ?? 120;
  const { palette, brightnessBias, irregularity, distortion } = profile;
  const pts: string[] = [];
  const steps = 48;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = t * w;
    const base = h * (1 - brightnessBias * 0.55 - 0.15);
    const wobble =
      Math.sin(t * Math.PI * (3 + irregularity * 6) + profile.phase * 10) *
      distortion *
      h *
      0.22;
    const y = base + wobble;
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  const d = `M 0 ${h} L ${pts.join(" L ")} L ${w} ${h} Z`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="Spectral surface"${options.className ? ` class="${options.className}"` : ""}><path d="${d}" fill="${palette.primaryAccent}" opacity="0.18"/><polyline points="${pts.join(" ")}" fill="none" stroke="${palette.primaryAccent}" stroke-width="1.25" opacity="0.85"/></svg>`;
}
