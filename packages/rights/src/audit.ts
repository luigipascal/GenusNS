import type {
  CompositionRightsRecord,
  RightsAuditEvent,
  RightsPolicyBundle,
} from "./types.js";

/** Provenance event at publication / confirmation. */
export function rightsPolicyConfirmedEvent(
  rights: RightsPolicyBundle,
  operator?: string,
): RightsAuditEvent {
  return {
    type: "RIGHTS_POLICY_CONFIRMED",
    timestamp: new Date().toISOString(),
    operator,
    metadata: {
      composition_authorship_status: rights.composition.authorshipStatus,
      publishing_royalty_status: rights.composition.publishingRoyaltyStatus,
      master_revenue_collection: rights.master.masterRevenueCollectionStatus,
    },
  };
}

/**
 * Audit when composition rights status changes.
 * Never silently overwrite — callers must append this event.
 */
export function compositionRightsChangedEvent(input: {
  before: Partial<CompositionRightsRecord> | null;
  after: Partial<CompositionRightsRecord>;
  operator?: string;
  reason?: string;
}): RightsAuditEvent {
  return {
    type: "COMPOSITION_RIGHTS_STATUS_CHANGED",
    before: input.before,
    after: input.after,
    operator: input.operator,
    timestamp: new Date().toISOString(),
    reason: input.reason,
  };
}
