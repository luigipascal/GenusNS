import type { ExperimentPalette } from "@genusns/genome-visuals";

/** Convert OKLCH channel values to sRGB hex (for sharp/librsvg covers). */
export function oklchToHex(l: number, c: number, h: number): string {
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);

  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;
  const l3 = l_ * l_ * l_;
  const m3 = m_ * m_ * m_;
  const s3 = s_ * s_ * s_;
  let r = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
  let g = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
  let bl = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3;

  const compand = (x: number) => {
    const v = Math.min(1, Math.max(0, x));
    return v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
  };
  r = Math.round(compand(r) * 255);
  g = Math.round(compand(g) * 255);
  bl = Math.round(compand(bl) * 255);
  return `#${[r, g, bl].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

export function paletteForRaster(palette: ExperimentPalette): ExperimentPalette {
  const p = palette.oklch.primary;
  const s = palette.oklch.secondary;
  return {
    ...palette,
    primaryAccent: oklchToHex(p.l, p.c, p.h),
    secondaryAccent: oklchToHex(s.l, s.c, s.h),
    mutedAccent: oklchToHex(Math.min(p.l, 0.45), Math.min(p.c, 0.06), p.h),
  };
}
