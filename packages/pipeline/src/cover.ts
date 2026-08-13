import type { ExperimentLaw, GenomeVisualProfile } from "@genusns/genome-visuals";
import { renderGenomeGlyphSvg } from "@genusns/genome-visuals";
import { paletteForRaster } from "./color";

export const COVER_ARTIST = "GENUS//NS";
export const COVER_LABEL = "0dB_Labs";
export const COVER_SIZE = 3000;

export interface CoverCopy {
  title: string;
  artist: string;
  label: string;
  subtitle?: string;
}

export function coverCopyFor(experiment: ExperimentLaw): CoverCopy {
  const short = experiment.digest.slice(0, 6).toUpperCase();
  return {
    title: short,
    artist: COVER_ARTIST,
    label: COVER_LABEL,
    subtitle: `${experiment.edo}-EDO · CYCLE ${experiment.cycleLength}`,
  };
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Album cover SVG: genome wheel as the dominant design,
 * plus title, artist (GENUS//NS), and label (0dB_Labs).
 * Accents are converted to hex so sharp/librsvg can rasterize color.
 */
export function renderAlbumCoverSvg(
  profile: GenomeVisualProfile,
  copy: CoverCopy,
  size = COVER_SIZE,
): string {
  const palette = paletteForRaster(profile.palette);
  const rasterProfile: GenomeVisualProfile = { ...profile, palette };

  const glyphSize = Math.round(size * 0.62);
  const glyphSvg = renderGenomeGlyphSvg(rasterProfile, {
    size: glyphSize,
    animate: false,
    title: copy.title,
  });
  // Nested <svg> works in sharp/librsvg
  const glyphX = (size - glyphSize) / 2;
  const glyphY = size * 0.14;

  const titleY = size * 0.82;
  const artistY = size * 0.875;
  const labelY = size * 0.925;
  const subY = size * 0.965;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${palette.background}"/>
  <circle cx="${size / 2}" cy="${size * 0.42}" r="${size * 0.38}" fill="none" stroke="${palette.mutedAccent}" stroke-width="${size * 0.0012}" opacity="0.25"/>
  <svg x="${glyphX}" y="${glyphY}" width="${glyphSize}" height="${glyphSize}">
    ${glyphSvg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "")}
  </svg>
  <text x="${size / 2}" y="${titleY}" text-anchor="middle"
    font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
    font-size="${size * 0.055}" font-weight="600" letter-spacing="${size * 0.012}"
    fill="${palette.foreground}">${escapeXml(copy.title)}</text>
  <text x="${size / 2}" y="${artistY}" text-anchor="middle"
    font-family="Courier New, Courier, monospace"
    font-size="${size * 0.028}" letter-spacing="${size * 0.018}"
    fill="${palette.primaryAccent}">${escapeXml(copy.artist)}</text>
  <text x="${size / 2}" y="${labelY}" text-anchor="middle"
    font-family="Courier New, Courier, monospace"
    font-size="${size * 0.022}" letter-spacing="${size * 0.014}"
    fill="${palette.foreground}" opacity="0.7">${escapeXml(copy.label)}</text>
  ${
    copy.subtitle
      ? `<text x="${size / 2}" y="${subY}" text-anchor="middle"
    font-family="Courier New, Courier, monospace"
    font-size="${size * 0.016}" letter-spacing="${size * 0.008}"
    fill="${palette.foreground}" opacity="0.4">${escapeXml(copy.subtitle)}</text>`
      : ""
  }
</svg>`;
}