export type {
  CompositionAuthorshipStatus,
  PublishingRoyaltyStatus,
  MasterRevenueCollectionStatus,
  ComponentAuthorshipStatus,
  ContributionRole,
  ClaimedAuthor,
  CompositionRightsRecord,
  MasterRightsRecord,
  ContributionCredit,
  SystemUsed,
  RightsPolicyBundle,
  RightsAuditEvent,
  RevenueCategory,
  ProjectRightsDefaults,
} from "./types";

export {
  PROJECT_RIGHTS_DEFAULTS,
  MACHINE_COMPOSITION_POLICY_NOTE,
  MACHINE_COMPOSITION_TOOLTIP,
  createDefaultMachineRightsBundle,
  mapWizardCompositionChoice,
} from "./defaults";

export {
  validateRightsPolicy,
  rightsValidationPassed,
} from "./validate";
export type { ValidationSeverity, RightsValidationItem } from "./validate";

export {
  renderAiDisclosureTxt,
  renderPackageRightsReadme,
  renderDistributorComposerWarning,
  toReleaseSheetRights,
} from "./documents";

export {
  rightsPolicyConfirmedEvent,
  compositionRightsChangedEvent,
} from "./audit";

export {
  summariseCatalogueRights,
  formatCatalogueRightsReport,
} from "./catalogue";
export type { CatalogueRightsSummary } from "./catalogue";

export {
  WIZARD_COMPOSITION_QUESTION,
  WIZARD_COMPOSITION_OPTIONS,
  STUDIO_PUBLISHING_DISPLAY,
  GENUS_POLICY_BANNER,
  applyWizardCompositionChoice,
  publicTraceRightsLabels,
} from "./studio";
export type { WizardCompositionChoice } from "./studio";
