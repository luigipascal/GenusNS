import { describe, expect, it } from "vitest";
import {
  createDefaultMachineRightsBundle,
  validateRightsPolicy,
  rightsValidationPassed,
  toReleaseSheetRights,
  renderAiDisclosureTxt,
  renderDistributorComposerWarning,
} from "./index";

describe("default machine rights policy", () => {
  const rights = createDefaultMachineRightsBundle();

  it("does not invent a composer", () => {
    expect(rights.composition.authorshipStatus).toBe(
      "MACHINE_GENERATED_NOT_CLAIMED",
    );
    expect(rights.composition.publishingRoyaltyStatus).toBe(
      "NOT_CLAIMED_MACHINE_GENERATED",
    );
    expect(rights.composition.claimedAuthors).toEqual([]);
    expect(rights.publishingRegistration).toBe(false);
  });

  it("still collects master revenue by default", () => {
    expect(rights.master.masterRevenueCollectionStatus).toBe("COLLECT");
    expect(rights.master.masterRightsHolder).toBe("GENUS//NS");
  });

  it("passes readiness with empty composer", () => {
    const items = validateRightsPolicy(rights);
    expect(rightsValidationPassed(items)).toBe(true);
    expect(
      items.some(
        (i) =>
          i.code === "COMPOSITION_UNCLAIMED_INTENTIONAL" && i.severity === "PASS",
      ),
    ).toBe(true);
  });

  it("release sheet marks composer_claimed NO", () => {
    const sheet = toReleaseSheetRights(rights);
    expect(sheet.composer_claimed).toBe("NO");
    expect(sheet.master_revenue_collection).toBe("YES");
    expect(sheet.ai_generated).toBe("YES");
  });

  it("disclosure does not claim public domain", () => {
    const txt = renderAiDisclosureTxt(rights);
    expect(txt.toLowerCase()).not.toContain("copyright-free");
    expect(txt.toLowerCase()).toContain(
      "not a claim that the work is public domain",
    );
    expect(txt).toContain("does not claim conventional");
    expect(renderDistributorComposerWarning(rights)).toContain(
      "Do not invent a composer",
    );
  });
});

describe("human-authored validation", () => {
  it("warns when human-authored has no composers", () => {
    const rights = createDefaultMachineRightsBundle();
    rights.composition.authorshipStatus = "HUMAN_AUTHORED";
    rights.composition.publishingRoyaltyStatus = "PENDING_REVIEW";
    rights.composition.claimedAuthors = [];
    const items = validateRightsPolicy(rights);
    expect(
      items.some((i) => i.code === "HUMAN_AUTHORED_MISSING_COMPOSER"),
    ).toBe(true);
  });
});

describe("wizard + catalogue", () => {
  it("maps fully machine to unclaimed publishing", async () => {
    const { applyWizardCompositionChoice, summariseCatalogueRights } =
      await import("./index.js");
    const { rights } = applyWizardCompositionChoice("fully_machine", {
      operator: "Neural Syntax",
      confirmed: true,
    });
    expect(rights.composition.claimedAuthors).toEqual([]);
    expect(rights.publishingRegistration).toBe(false);
    expect(rights.master.masterRevenueCollectionStatus).toBe("COLLECT");
    const summary = summariseCatalogueRights([rights]);
    expect(summary.machineGeneratedPublishingNotClaimed).toBe(1);
    expect(summary.masterRevenueCollectionEnabled).toBe(1);
  });
});
