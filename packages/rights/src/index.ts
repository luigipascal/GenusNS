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
} from "./types.js";

export {
  PROJECT_RIGHTS_DEFAULTS,
  MACHINE_COMPOSITION_POLICY_NOTE,
  MACHINE_COMPOSITION_TOOLTIP,
  createDefaultMachineRightsBundle,
  mapWizardCompositionChoice,
} from "./defaults.js";

export {
  validateRightsPolicy,
  rightsValidationPassed,
} from "./validate.js";
export type { ValidationSeverity, RightsValidationItem } from "./validate.js";

export {
  renderAiDisclosureTxt,
  renderPackageRightsReadme,
  renderDistributorComposerWarning,
  toReleaseSheetRights,
} from "./documents.js";

export {
  rightsPolicyConfirmedEvent,
  compositionRightsChangedEvent,
} from "./audit.js";

export {
  summariseCatalogueRights,
  formatCatalogueRightsReport,
} from "./catalogue.js";
export type { CatalogueRightsSummary } from "./catalogue.js";

export {
  WIZARD_COMPOSITION_QUESTION,
  WIZARD_COMPOSITION_OPTIONS,
  STUDIO_PUBLISHING_DISPLAY,
  GENUS_POLICY_BANNER,
  applyWizardCompositionChoice,
  publicTraceRightsLabels,
} from "./studio.js";
export type { WizardCompositionChoice } from "./studio.js";
