import { describe, expect, it } from "vitest";
import {
  createGenomeVisualProfile,
  interpolateVisualProfiles,
  listExperiments,
  resolveExperiment,
} from "./index";

describe("experiment catalog", () => {
  it("loads compiled Genus species", () => {
    expect(listExperiments().length).toBeGreaterThanOrEqual(16);
    expect(resolveExperiment("288fbd")?.edo).toBe(36);
    expect(resolveExperiment("GENUS//NS:6336B6")?.cycleLength).toBe(17);
  });
});

describe("interpolateVisualProfiles", () => {
  it("moves continuously between two laws", () => {
    const a = createGenomeVisualProfile(resolveExperiment("288fbd")!);
    const b = createGenomeVisualProfile(resolveExperiment("6336b6")!);
    const mid = interpolateVisualProfiles(a, b, 0.5);
    expect(mid.canonicalId).toBe("VISUAL INTERPOLATION");
    expect(mid.radialSegments).toBeGreaterThanOrEqual(19);
    expect(mid.radialSegments).toBeLessThanOrEqual(36);
  });
});
