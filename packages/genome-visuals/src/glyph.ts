import type { GenomeVisualProfile } from "./types";

export interface GlyphRenderOptions {
  size?: number;
  /** Include subtle animation CSS when true (caller may strip for reduced motion). */
  animate?: boolean;
  className?: string;
  title?: string;
}

function polar(cx: number, cy: number, r: number, angle: number) {
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  };
}

/**
 * Deterministic Genome Glyph SVG.
 * Outer ring = EDO · ticks = allowed degrees · inner = cycle · marks = accents / Euclid · centre = digest topology.
 */
export function renderGenomeGlyphSvg(
  profile: GenomeVisualProfile,
  options: GlyphRenderOptions = {},
): string {
  const size = options.size ?? 256;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.42;
  const midR = size * 0.28;
  const innerR = size * 0.16;
  const coreR = size * 0.06;
  const stroke = Math.max(0.75, (size / 256) * profile.lineThicknessBias);
  const { palette } = profile;
  const rot = profile.rotationOffset - Math.PI / 2;

  const parts: string[] = [];

  // Outer EDO ring
  parts.push(
    `<circle cx="${cx}" cy="${cy}" r="${outerR}" fill="none" stroke="${palette.mutedAccent}" stroke-width="${stroke * 0.6}" opacity="0.55"/>`,
  );

  for (let i = 0; i < profile.radialSegments; i++) {
    const a = rot + (i / profile.radialSegments) * Math.PI * 2;
    const active = profile.allowedDegrees.includes(i);
    const p0 = polar(cx, cy, outerR - (active ? size * 0.045 : size * 0.018), a);
    const p1 = polar(cx, cy, outerR + (active ? size * 0.012 : 0), a);
    parts.push(
      `<line x1="${p0.x.toFixed(2)}" y1="${p0.y.toFixed(2)}" x2="${p1.x.toFixed(2)}" y2="${p1.y.toFixed(2)}" stroke="${active ? palette.primaryAccent : palette.mutedAccent}" stroke-width="${active ? stroke * 1.2 : stroke * 0.45}" opacity="${active ? 0.95 : 0.25}"/>`,
    );
  }

  // Cycle ring
  parts.push(
    `<circle cx="${cx}" cy="${cy}" r="${midR}" fill="none" stroke="${palette.secondaryAccent}" stroke-width="${stroke * 0.5}" opacity="0.4"/>`,
  );

  for (let i = 0; i < profile.pulseCount; i++) {
    const a = rot + (i / profile.pulseCount) * Math.PI * 2;
    const isAccent = profile.accents.includes(i);
    const isEuclid = profile.euclideanHits.includes(i);
    const p = polar(cx, cy, midR, a);
    if (isAccent) {
      parts.push(
        `<circle cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="${(size * 0.028).toFixed(2)}" fill="${palette.primaryAccent}" opacity="0.95"/>`,
      );
    } else if (isEuclid) {
      parts.push(
        `<rect x="${(p.x - size * 0.012).toFixed(2)}" y="${(p.y - size * 0.012).toFixed(2)}" width="${(size * 0.024).toFixed(2)}" height="${(size * 0.024).toFixed(2)}" fill="${palette.secondaryAccent}" transform="rotate(45 ${p.x.toFixed(2)} ${p.y.toFixed(2)})" opacity="0.9"/>`,
      );
    } else {
      parts.push(
        `<circle cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="${(size * 0.008).toFixed(2)}" fill="${palette.foreground}" opacity="0.35"/>`,
      );
    }
  }

  // Inner form ring (node count arcs)
  const n = Math.max(1, profile.nodeCount);
  for (let i = 0; i < n; i++) {
    const a0 = rot + (i / n) * Math.PI * 2;
    const a1 = rot + ((i + 0.72) / n) * Math.PI * 2;
    const p0 = polar(cx, cy, innerR, a0);
    const p1 = polar(cx, cy, innerR, a1);
    parts.push(
      `<path d="M ${p0.x.toFixed(2)} ${p0.y.toFixed(2)} A ${innerR} ${innerR} 0 0 1 ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}" fill="none" stroke="${palette.foreground}" stroke-width="${stroke * 0.7}" opacity="0.35"/>`,
    );
  }

  // Centre topology from digest
  const topo = profile.centreTopology;
  if (topo === 0) {
    parts.push(
      `<circle cx="${cx}" cy="${cy}" r="${coreR}" fill="none" stroke="${palette.primaryAccent}" stroke-width="${stroke}"/>`,
    );
  } else if (topo === 1) {
    const r = coreR * 1.2;
    parts.push(
      `<polygon points="${[0, 1, 2].map((i) => { const p = polar(cx, cy, r, rot + profile.phase * Math.PI * 2 + (i * 2 * Math.PI) / 3); return `${p.x.toFixed(2)},${p.y.toFixed(2)}`; }).join(" ")}" fill="none" stroke="${palette.primaryAccent}" stroke-width="${stroke}"/>`,
    );
  } else if (topo === 2) {
    for (let i = 0; i < 4; i++) {
      const p = polar(cx, cy, coreR, rot + (i * Math.PI) / 2);
      parts.push(
        `<line x1="${cx}" y1="${cy}" x2="${p.x.toFixed(2)}" y2="${p.y.toFixed(2)}" stroke="${palette.secondaryAccent}" stroke-width="${stroke * 0.8}"/>`,
      );
    }
  } else if (topo === 3) {
    parts.push(
      `<rect x="${(cx - coreR).toFixed(2)}" y="${(cy - coreR).toFixed(2)}" width="${(coreR * 2).toFixed(2)}" height="${(coreR * 2).toFixed(2)}" fill="none" stroke="${palette.primaryAccent}" stroke-width="${stroke}" transform="rotate(${((profile.phase * 45) % 45).toFixed(1)} ${cx} ${cy})"/>`,
    );
  } else {
    parts.push(
      `<circle cx="${cx}" cy="${cy}" r="${coreR * 0.45}" fill="${palette.primaryAccent}"/>`,
      `<circle cx="${cx}" cy="${cy}" r="${coreR}" fill="none" stroke="${palette.secondaryAccent}" stroke-width="${stroke * 0.6}" stroke-dasharray="${(size * 0.02).toFixed(1)} ${(size * 0.015).toFixed(1)}"/>`,
    );
  }

  const title = options.title ?? profile.canonicalId;
  const anim =
    options.animate
      ? `<style>@media (prefers-reduced-motion: no-preference){ .gns-glyph-spin { transform-origin: ${cx}px ${cy}px; animation: gns-spin ${30 / Math.max(profile.motionRate, 0.15)}s linear infinite; } @keyframes gns-spin { to { transform: rotate(360deg); } } }</style>`
      : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="${escapeXml(title)}"${options.className ? ` class="${options.className}"` : ""}>${anim}<title>${escapeXml(title)}</title><g class="gns-glyph-spin">${parts.join("")}</g></svg>`;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
