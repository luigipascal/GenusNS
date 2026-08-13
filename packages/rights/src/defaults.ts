import type {
  CompositionAuthorshipStatus,
  ContributionCredit,
  MasterRightsRecord,
  ProjectRightsDefaults,
  PublishingRoyaltyStatus,
  RightsPolicyBundle,
  SystemUsed,
} from "./types";

export const PROJECT_RIGHTS_DEFAULTS: ProjectRightsDefaults = {
  DEFAULT_MACHINE_COMPOSITION_AUTHORSHIP_STATUS: "MACHINE_GENERATED_NOT_CLAIMED",
  DEFAULT_MACHINE_PUBLISHING_ROYALTY_STATUS: "NOT_CLAIMED_MACHINE_GENERATED",
  DEFAULT_MASTER_REVENUE_COLLECTION: "COLLECT",
  DEFAULT_MASTER_RIGHTS_HOLDER: "GENUS//NS",
};

export const MACHINE_COMPOSITION_POLICY_NOTE =
  "GENUS//NS does not claim conventional composer/songwriter publishing royalties for this fully machine-generated work.";

export const MACHINE_COMPOSITION_TOOLTIP =
  "GENUS//NS does not claim conventional composer/songwriter publishing royalties for this fully machine-generated work.";

const DEFAULT_CREDITS: ContributionCredit[] = [
  {
    contributor: "Neural Syntax",
    role: "SYSTEM_DESIGN",
    description: "System design",
    legalAuthorshipClaim: false,
  },
  {
    contributor: "Neural Syntax",
    role: "OPERATOR",
    description: "System operation",
    legalAuthorshipClaim: false,
  },
  {
    contributor: "Neural Syntax",
    role: "CURATION",
    description: "Selection and curation",
    legalAuthorshipClaim: false,
  },
  {
    contributor: "Genus / Genre Genesis",
    role: "GENRE_GENESIS",
    description: "Genre law invention",
    legalAuthorshipClaim: false,
  },
  {
    contributor: "machine generated",
    role: "GENERATION",
    description: "Audio realisation",
    legalAuthorshipClaim: false,
  },
];

/**
 * Default rights bundle for fully autonomous GENUS experiments.
 * Does not invent a human composer. Master revenue may still be collected.
 */
export function createDefaultMachineRightsBundle(
  overrides?: {
    systemsUsed?: SystemUsed[];
    master?: Partial<MasterRightsRecord>;
    operatorConfirmedBy?: string;
    operatorConfirmedAt?: string;
  },
): RightsPolicyBundle {
  const d = PROJECT_RIGHTS_DEFAULTS;
  const now = overrides?.operatorConfirmedAt ?? new Date().toISOString();

  return {
    schema: "genusns.rights.v1",
    composition: {
      authorshipStatus: d.DEFAULT_MACHINE_COMPOSITION_AUTHORSHIP_STATUS,
      publishingRoyaltyStatus: d.DEFAULT_MACHINE_PUBLISHING_ROYALTY_STATUS,
      claimedAuthors: [],
      lyricsAuthorshipStatus: "NONE",
      musicAuthorshipStatus: "MACHINE_GENERATED_NOT_CLAIMED",
      policyNote: MACHINE_COMPOSITION_POLICY_NOTE,
      rightsBasisNotes:
        "Project policy for fully machine-generated GENUS works. Not a determination that no copyright exists anywhere.",
      operatorConfirmedAt: overrides?.operatorConfirmedBy ? now : undefined,
      operatorConfirmedBy: overrides?.operatorConfirmedBy,
    },
    master: {
      masterRightsHolder: d.DEFAULT_MASTER_RIGHTS_HOLDER,
      masterProducer: "GENUS//NS",
      masterRightsBasis: "Released sound recording / master",
      masterRevenueCollectionStatus: d.DEFAULT_MASTER_REVENUE_COLLECTION,
      ...overrides?.master,
    },
    credits: DEFAULT_CREDITS,
    systemsUsed: overrides?.systemsUsed ?? [],
    publishingRegistration: false,
    aiGenerated: true,
    humanComposition: false,
    humanLyrics: false,
    humanPerformance: false,
  };
}

export function mapWizardCompositionChoice(
  choice:
    | "fully_machine"
    | "human_machine"
    | "primarily_human"
    | "undetermined",
): {
  authorshipStatus: CompositionAuthorshipStatus;
  publishingRoyaltyStatus: PublishingRoyaltyStatus;
} {
  switch (choice) {
    case "fully_machine":
      return {
        authorshipStatus: "MACHINE_GENERATED_NOT_CLAIMED",
        publishingRoyaltyStatus: "NOT_CLAIMED_MACHINE_GENERATED",
      };
    case "human_machine":
      return {
        authorshipStatus: "HUMAN_AI_COLLABORATIVE",
        publishingRoyaltyStatus: "PENDING_REVIEW",
      };
    case "primarily_human":
      return {
        authorshipStatus: "HUMAN_AUTHORED",
        publishingRoyaltyStatus: "PENDING_REVIEW",
      };
    default:
      return {
        authorshipStatus: "UNDETERMINED",
        publishingRoyaltyStatus: "PENDING_REVIEW",
      };
  }
}
