import { describe, expect, it } from "vitest";
import { composeInstructionFromLaw } from "./compose-instruction";
import { experiment288fbd } from "./fixtures/288fbd";

describe("composeInstructionFromLaw", () => {
  it("locks a Genus Compose prompt from the 288FBD law", () => {
    const ci = composeInstructionFromLaw(experiment288fbd);
    expect(ci.schema).toBe("genusns.compose-instruction.v1");
    expect(ci.key).toBe("EDO36");
    expect(ci.prompt).toContain("36-EDO");
    expect(ci.prompt).toContain("Euclidean(3,13)");
    expect(ci.constraints[0]).toMatch(/Genus Compose/);
  });
});
