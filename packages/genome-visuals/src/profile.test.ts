import { describe, expect, it } from "vitest";
import { experiment288fbd } from "./fixtures/288fbd";
import { renderGenomeGlyphSvg } from "./glyph";
import { createExperimentPalette } from "./palette";
import { createGenomeVisualProfile } from "./profile";
import { euclideanPattern } from "./euclidean";
import { VISUAL_PROFILE_VERSION } from "./types";

describe("euclideanPattern", () => {
  it("places 3 pulses on 13 steps for 288FBD", () => {
    expect(euclideanPattern(3, 13)).toEqual([4, 8, 12]);
  });
});

describe("createGenomeVisualProfile(288FBD)", () => {
  const a = createGenomeVisualProfile(experiment288fbd);
  const b = createGenomeVisualProfile(experiment288fbd);

  it("is fully deterministic", () => {
    expect(a).toEqual(b);
  });

  it("encodes the musical law", () => {
    expect(a.version).toBe(VISUAL_PROFILE_VERSION);
    expect(a.radialSegments).toBe(36);
    expect(a.pulseCount).toBe(13);
    expect(a.accents).toEqual([7, 11]);
    expect(a.euclideanHits).toEqual([4, 8, 12]);
    expect(a.allowedDegrees).toHaveLength(18);
    expect(a.bpm).toBe(93.18);
    expect(a.eventCount).toBe(598);
    expect(a.formNodes).toEqual(["Ash", "Drift", "B", "Lock", "E"]);
    expect(a.canonicalId).toBe("GENUS//NS:288FBD");
  });

  it("keeps geometryVariant and phases stable", () => {
    expect(a.geometryVariant).toBe(b.geometryVariant);
    expect(a.rotationOffset).toBe(b.rotationOffset);
    expect(a.phase).toBe(b.phase);
    expect(a.centreTopology).toBe(b.centreTopology);
  });
});

describe("createExperimentPalette", () => {
  it("is deterministic for the digest", () => {
    expect(createExperimentPalette("288fbdc2281bc4c8")).toEqual(
      createExperimentPalette("288fbdc2281bc4c8"),
    );
  });
});

describe("renderGenomeGlyphSvg", () => {
  const profile = createGenomeVisualProfile(experiment288fbd);

  it("emits a stable SVG snapshot", () => {
    const svg = renderGenomeGlyphSvg(profile, { size: 256, animate: false });
    expect(svg).toMatchSnapshot();
    expect(svg).toContain('aria-label="GENUS//NS:288FBD"');
    expect(svg).toContain("<svg");
  });

  it("encodes 36 outer ticks and accent markers", () => {
    const svg = renderGenomeGlyphSvg(profile, { size: 256 });
    // Allowed degree ticks use primaryAccent strokes — structural presence
    expect((svg.match(/<line /g) ?? []).length).toBeGreaterThanOrEqual(36);
    expect((svg.match(/<circle /g) ?? []).length).toBeGreaterThan(2);
  });
});
