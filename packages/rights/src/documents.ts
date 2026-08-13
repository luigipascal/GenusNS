import type { RightsPolicyBundle } from "./types.js";

/** Editable AI disclosure text for release packages. */
export function renderAiDisclosureTxt(rights: RightsPolicyBundle): string {
  const lines = [
    "AI_DISCLOSURE",
    "=============",
    "",
    "This recording was created through the GENUS experimental system operated by Neural Syntax.",
    "",
    "The underlying musical experiment and audio realisation involved generative software systems.",
    "",
    "Neural Syntax operated the system and selected the material for publication.",
    "",
  ];

  if (
    rights.composition.authorshipStatus === "MACHINE_GENERATED_NOT_CLAIMED"
  ) {
    lines.push(
      "GENUS//NS does not claim conventional human composer/songwriter publishing royalties for this fully machine-generated composition.",
      "",
    );
  } else {
    lines.push(
      `Composition authorship status: ${rights.composition.authorshipStatus}`,
      `Publishing royalty status: ${rights.composition.publishingRoyaltyStatus}`,
      "",
    );
  }

  lines.push(
    "Rights and revenues associated with the released sound recording are managed separately.",
    "",
  );

  if (rights.composition.rightsBasisNotes) {
    lines.push("Notes:", rights.composition.rightsBasisNotes, "");
  }

  lines.push(
    "This disclosure is project policy and factual provenance. It is not a claim that the work is public domain or that no copyright exists in any jurisdiction.",
    "",
  );

  return lines.filter((l, i, arr) => !(l === "" && arr[i - 1] === "")).join("\n");
}

export function renderPackageRightsReadme(rights: RightsPolicyBundle): string {
  const pub =
    rights.composition.publishingRoyaltyStatus ===
    "NOT_CLAIMED_MACHINE_GENERATED"
      ? "Not claimed by GENUS//NS for this release."
      : rights.composition.publishingRoyaltyStatus;

  const master =
    rights.master.masterRevenueCollectionStatus === "COLLECT"
      ? "Collected through the appointed distributor."
      : rights.master.masterRevenueCollectionStatus;

  return [
    "RIGHTS AND REVENUE POLICY",
    "========================",
    "",
    "Composition:",
    rights.composition.authorshipStatus === "MACHINE_GENERATED_NOT_CLAIMED"
      ? "Machine-generated through the GENUS experimental system."
      : rights.composition.authorshipStatus,
    "",
    "Composer/songwriter publishing royalties:",
    pub,
    "",
    "Human role:",
    "System operation, curation and selection as recorded in provenance.",
    "",
    "Sound recording:",
    `Released commercially by ${rights.master.masterRightsHolder}.`,
    "",
    "Master-side distribution revenue:",
    master,
    "",
    "Publishing registration:",
    rights.publishingRegistration ? "ON" : "OFF",
    "",
    "Do not invent a composer to satisfy a distributor form.",
    "If a distributor requires a composer field and none is claimed, treat that as a manual distributor issue.",
    "",
  ].join("\n");
}

export function renderDistributorComposerWarning(
  rights: RightsPolicyBundle,
): string | null {
  if (
    rights.composition.authorshipStatus === "MACHINE_GENERATED_NOT_CLAIMED" &&
    rights.composition.claimedAuthors.length === 0
  ) {
    return [
      "DISTRIBUTOR REQUIRES A COMPOSER FIELD",
      "",
      "GENUS//NS has no composer claim recorded for this work.",
      "",
      "Do not invent a composer.",
      "",
      "Review the distributor's current handling of machine-generated compositions before submission.",
    ].join("\n");
  }
  return null;
}

/** Release sheet row fields (flat). */
export function toReleaseSheetRights(rights: RightsPolicyBundle) {
  return {
    composition_authorship_status: rights.composition.authorshipStatus,
    publishing_royalty_status: rights.composition.publishingRoyaltyStatus,
    composer_claimed: rights.composition.claimedAuthors.length > 0 ? "YES" : "NO",
    master_rights_holder: rights.master.masterRightsHolder,
    master_revenue_collection:
      rights.master.masterRevenueCollectionStatus === "COLLECT" ? "YES" : "NO",
    ai_generated: rights.aiGenerated ? "YES" : "NO",
    human_composition: rights.humanComposition ? "YES" : "NO",
    human_lyrics: rights.humanLyrics ? "YES" : "NO",
    human_performance: rights.humanPerformance ? "YES" : "NO",
    publishing_registration: rights.publishingRegistration ? "ON" : "OFF",
  };
}

// rightsPolicyConfirmedEvent lives in audit.ts (re-exported from index).
