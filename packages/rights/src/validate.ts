import type { RightsPolicyBundle } from "./types";

export type ValidationSeverity = "PASS" | "WARNING" | "ERROR" | "INFO";

export interface RightsValidationItem {
  code: string;
  severity: ValidationSeverity;
  message: string;
}

/**
 * Readiness validation for composition / master rights.
 * Empty composer claims are intentional for MACHINE_GENERATED_NOT_CLAIMED.
 */
export function validateRightsPolicy(
  rights: RightsPolicyBundle,
): RightsValidationItem[] {
  const items: RightsValidationItem[] = [];

  const { composition, master } = rights;

  if (
    composition.authorshipStatus === "MACHINE_GENERATED_NOT_CLAIMED" &&
    composition.publishingRoyaltyStatus === "NOT_CLAIMED_MACHINE_GENERATED"
  ) {
    if (composition.claimedAuthors.length === 0) {
      items.push({
        code: "COMPOSITION_UNCLAIMED_INTENTIONAL",
        severity: "PASS",
        message: "Composition royalties intentionally not claimed.",
      });
    } else {
      items.push({
        code: "COMPOSITION_UNCLAIMED_BUT_AUTHORS_PRESENT",
        severity: "WARNING",
        message:
          "Authorship status is MACHINE_GENERATED_NOT_CLAIMED but claimedAuthors is non-empty.",
      });
    }
  }

  if (
    composition.authorshipStatus === "HUMAN_AUTHORED" &&
    composition.claimedAuthors.length === 0
  ) {
    items.push({
      code: "HUMAN_AUTHORED_MISSING_COMPOSER",
      severity: "WARNING",
      message: "Human-authored composition has no composer information.",
    });
  }

  // Never invent 100% writer shares
  const fakeShare = composition.claimedAuthors.some(
    (a) =>
      a.sharePercent === 100 &&
      composition.authorshipStatus === "MACHINE_GENERATED_NOT_CLAIMED",
  );
  if (fakeShare) {
    items.push({
      code: "FAKE_WRITER_SHARE",
      severity: "ERROR",
      message:
        "Do not assign 100% writer share on a machine-generated composition with no publishing claim.",
    });
  }

  if (master.masterRevenueCollectionStatus === "COLLECT") {
    items.push({
      code: "MASTER_REVENUE_COLLECT",
      severity: "INFO",
      message: "Master-side distribution revenue collection enabled.",
    });
  }

  // Forbidden: AI as legal composer name in claimedAuthors
  const aiAsPerson = composition.claimedAuthors.some((a) =>
    /suno|minimax|ace-?step|gpt|ollama|agent\s*\d+/i.test(a.name),
  );
  if (aiAsPerson) {
    items.push({
      code: "AI_CREDITED_AS_LEGAL_PERSON",
      severity: "ERROR",
      message:
        "AI systems must not appear as conventional composers. Use systemsUsed provenance instead.",
    });
  }

  return items;
}

export function rightsValidationPassed(items: RightsValidationItem[]): boolean {
  return !items.some((i) => i.severity === "ERROR");
}
