import type { RightsPolicyBundle } from "./types";

export interface CatalogueRightsSummary {
  publishedRecordings: number;
  machineGeneratedPublishingNotClaimed: number;
  humanAiCollaborative: number;
  humanAuthored: number;
  undetermined: number;
  masterRevenueCollectionEnabled: number;
}

/** Studio catalogue reporting — makes project policy auditable. */
export function summariseCatalogueRights(
  rightsList: RightsPolicyBundle[],
): CatalogueRightsSummary {
  let machineGeneratedPublishingNotClaimed = 0;
  let humanAiCollaborative = 0;
  let humanAuthored = 0;
  let undetermined = 0;
  let masterRevenueCollectionEnabled = 0;

  for (const r of rightsList) {
    switch (r.composition.authorshipStatus) {
      case "MACHINE_GENERATED_NOT_CLAIMED":
        if (
          r.composition.publishingRoyaltyStatus ===
          "NOT_CLAIMED_MACHINE_GENERATED"
        ) {
          machineGeneratedPublishingNotClaimed += 1;
        }
        break;
      case "HUMAN_AI_COLLABORATIVE":
        humanAiCollaborative += 1;
        break;
      case "HUMAN_AUTHORED":
        humanAuthored += 1;
        break;
      default:
        undetermined += 1;
    }
    if (r.master.masterRevenueCollectionStatus === "COLLECT") {
      masterRevenueCollectionEnabled += 1;
    }
  }

  return {
    publishedRecordings: rightsList.length,
    machineGeneratedPublishingNotClaimed,
    humanAiCollaborative,
    humanAuthored,
    undetermined,
    masterRevenueCollectionEnabled,
  };
}

export function formatCatalogueRightsReport(
  summary: CatalogueRightsSummary,
): string {
  return [
    "GENUS//NS CATALOGUE",
    "",
    `Published recordings: ${summary.publishedRecordings}`,
    "",
    `Machine-generated compositions`,
    `with publishing royalties not claimed: ${summary.machineGeneratedPublishingNotClaimed}`,
    "",
    `Human/AI collaborative compositions: ${summary.humanAiCollaborative}`,
    `Human-authored compositions: ${summary.humanAuthored}`,
    `Undetermined / needs review: ${summary.undetermined}`,
    "",
    `Master revenue collection enabled: ${summary.masterRevenueCollectionEnabled}`,
    "",
  ].join("\n");
}
