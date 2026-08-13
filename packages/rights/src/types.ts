/**
 * GENUS//NS composition rights, credits and revenue policy — domain types.
 * Project policy, not an automated legal determination.
 */

export type CompositionAuthorshipStatus =
  | "HUMAN_AUTHORED"
  | "HUMAN_AI_COLLABORATIVE"
  | "MACHINE_GENERATED_NOT_CLAIMED"
  | "UNDETERMINED";

export type PublishingRoyaltyStatus =
  | "CLAIMED"
  | "PARTIALLY_CLAIMED"
  | "NOT_CLAIMED_MACHINE_GENERATED"
  | "NOT_CLAIMED_OTHER"
  | "PENDING_REVIEW"
  | "NOT_APPLICABLE";

export type MasterRevenueCollectionStatus =
  | "COLLECT"
  | "DO_NOT_COLLECT"
  | "PENDING";

export type ComponentAuthorshipStatus =
  | "HUMAN_AUTHORED"
  | "MACHINE_GENERATED_NOT_CLAIMED"
  | "HUMAN_AI_COLLABORATIVE"
  | "NONE"
  | "UNDETERMINED";

export type ContributionRole =
  | "SYSTEM_DESIGN"
  | "OPERATOR"
  | "CURATION"
  | "GENRE_GENESIS"
  | "GENERATION"
  | "HUMAN_COMPOSITION"
  | "HUMAN_LYRICS"
  | "HUMAN_PERFORMANCE"
  | "ARRANGEMENT"
  | "REFINEMENT"
  | "MIXING"
  | "MASTERING"
  | "ART_DIRECTION"
  | "PRODUCTION";

export interface ClaimedAuthor {
  name: string;
  role: string;
  sharePercent?: number;
}

export interface CompositionRightsRecord {
  authorshipStatus: CompositionAuthorshipStatus;
  publishingRoyaltyStatus: PublishingRoyaltyStatus;
  claimedAuthors: ClaimedAuthor[];
  lyricsAuthorshipStatus?: ComponentAuthorshipStatus;
  musicAuthorshipStatus?: ComponentAuthorshipStatus;
  policyNote?: string;
  rightsBasisNotes?: string;
  operatorConfirmedAt?: string;
  operatorConfirmedBy?: string;
}

export interface MasterRightsRecord {
  masterRightsHolder: string;
  masterProducer?: string;
  masterRightsBasis?: string;
  masterRevenueCollectionStatus: MasterRevenueCollectionStatus;
}

export interface ContributionCredit {
  contributor: string;
  role: ContributionRole;
  description?: string;
  /** Explicit legal authorship claim — null/undefined means not asserted. */
  legalAuthorshipClaim?: boolean | null;
}

export interface SystemUsed {
  provider: string;
  model?: string;
  role: string;
}

export interface RightsPolicyBundle {
  schema: "genusns.rights.v1";
  composition: CompositionRightsRecord;
  master: MasterRightsRecord;
  credits: ContributionCredit[];
  systemsUsed: SystemUsed[];
  publishingRegistration: boolean;
  aiGenerated: boolean;
  humanComposition: boolean;
  humanLyrics: boolean;
  humanPerformance: boolean;
}

export interface RightsAuditEvent {
  type: "COMPOSITION_RIGHTS_STATUS_CHANGED" | "RIGHTS_POLICY_CONFIRMED";
  before?: Partial<CompositionRightsRecord> | null;
  after?: Partial<CompositionRightsRecord> | null;
  operator?: string;
  timestamp: string;
  reason?: string;
  metadata?: Record<string, string>;
}

/** Future revenue categories — do not collapse under a single "royalties". */
export type RevenueCategory =
  | "MASTER_STREAMING"
  | "MASTER_DOWNLOAD"
  | "MASTER_SYNC"
  | "MASTER_OTHER"
  | "COMPOSITION_PERFORMANCE"
  | "COMPOSITION_MECHANICAL"
  | "COMPOSITION_SYNC"
  | "COMPOSITION_OTHER";

export interface ProjectRightsDefaults {
  DEFAULT_MACHINE_COMPOSITION_AUTHORSHIP_STATUS: CompositionAuthorshipStatus;
  DEFAULT_MACHINE_PUBLISHING_ROYALTY_STATUS: PublishingRoyaltyStatus;
  DEFAULT_MASTER_REVENUE_COLLECTION: MasterRevenueCollectionStatus;
  DEFAULT_MASTER_RIGHTS_HOLDER: string;
}
