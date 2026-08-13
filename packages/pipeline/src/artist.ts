import type { ExperimentLaw, GenomeVisualProfile } from "@genusns/genome-visuals";
import { renderGenomeGlyphSvg } from "@genusns/genome-visuals";
import { paletteForRaster } from "./color.js";
import { COVER_ARTIST, COVER_LABEL, COVER_SIZE } from "./cover.js";

/**
 * Artist profile image for GENUS//NS — built from the first compiled genome.
 * Square 3000×3000 for Ditto / storefront / site identity.
 */
export function renderArtistImageSvg(
  profile: GenomeVisualProfile,
  experiment: ExperimentLaw,
  size = COVER_SIZE,
): string {
  const palette = paletteForRaster(profile.palette);
  const rasterProfile: GenomeVisualProfile = { ...profile, palette };
  const glyphSize = Math.round(size * 0.72);
  const glyphSvg = renderGenomeGlyphSvg(rasterProfile, {
    size: glyphSize,
    animate: false,
    title: COVER_ARTIST,
  });
  const glyphX = (size - glyphSize) / 2;
  const glyphY = size * 0.08;
  const short = experiment.digest.slice(0, 6).toUpperCase();

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${palette.background}"/>
  <circle cx="${size / 2}" cy="${size * 0.44}" r="${size * 0.42}" fill="none" stroke="${palette.mutedAccent}" stroke-width="${size * 0.001}" opacity="0.2"/>
  <svg x="${glyphX}" y="${glyphY}" width="${glyphSize}" height="${glyphSize}">
    ${glyphSvg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "")}
  </svg>
  <text x="${size / 2}" y="${size * 0.86}" text-anchor="middle"
    font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
    font-size="${size * 0.048}" font-weight="600" letter-spacing="${size * 0.014}"
    fill="${palette.foreground}">GENUS//NS</text>
  <text x="${size / 2}" y="${size * 0.91}" text-anchor="middle"
    font-family="Courier New, Courier, monospace"
    font-size="${size * 0.02}" letter-spacing="${size * 0.012}"
    fill="${palette.primaryAccent}">${COVER_LABEL}</text>
  <text x="${size / 2}" y="${size * 0.955}" text-anchor="middle"
    font-family="Courier New, Courier, monospace"
    font-size="${size * 0.014}" letter-spacing="${size * 0.006}"
    fill="${palette.foreground}" opacity="0.4">ARTIST MARK · FIRST GENOME ${short} · ${experiment.edo}-EDO</text>
</svg>`;
}
