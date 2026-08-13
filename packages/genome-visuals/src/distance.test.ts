import { describe, expect, it } from "vitest";
import {
  findFarExperiments,
  findNearExperiments,
  parameterDistance,
  resolveExperiment,
} from "./index";

describe("parameter distance", () => {
  it("ranks near vs far without claiming musical similarity", () => {
    const origin = resolveExperiment("288fbd")!;
    const near = findNearExperiments(origin, 1)[0]!;
    const far = findFarExperiments(origin, 1)[0]!;
    expect(parameterDistance(origin, near)).toBeLessThan(
      parameterDistance(origin, far),
    );
  });
});
