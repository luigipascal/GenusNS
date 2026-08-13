import {
  createDefaultMachineRightsBundle,
  mapWizardCompositionChoice,
  MACHINE_COMPOSITION_POLICY_NOTE,
  PROJECT_RIGHTS_DEFAULTS,
} from "./defaults";
import type {
  CompositionAuthorshipStatus,
  RightsPolicyBundle,
} from "./types";
import { compositionRightsChangedEvent } from "./audit";

export type WizardCompositionChoice =
  | "fully_machine"
  | "human_machine"
  | "primarily_human"
  | "undetermined";

export const WIZARD_COMPOSITION_QUESTION = "HOW WAS THE COMPOSITION CREATED?";

export const WIZARD_COMPOSITION_OPTIONS: Array<{
  id: WizardCompositionChoice;
  label: string;
}> = [
  { id: "fully_machine", label: "Fully machine-generated" },
  { id: "human_machine", label: "Human + machine" },
  { id: "primarily_human", label: "Primarily human-authored" },
  { id: "undetermined", label: "Undetermined / needs review" },
];

export const STUDIO_PUBLISHING_DISPLAY = {
  heading: "Publishing royalties",
  status: "NOT CLAIMED",
  detail: "Machine-generated composition",
  tooltip: MACHINE_COMPOSITION_POLICY_NOTE,
} as const;

export const GENUS_POLICY_BANNER = {
  title: "GENUS//NS POLICY",
  body: "Composer/songwriter publishing royalties will not be claimed for this work.\n\nMaster recording revenue may still be collected separately.",
} as const;

/**
 * Apply release-wizard composition answer.
 * Does not invent composers. Defaults: publishing OFF, master COLLECT ON for machine.
 */
export function applyWizardCompositionChoice(
  choice: WizardCompositionChoice,
  options: {
    previous?: RightsPolicyBundle | null;
    operator?: string;
    confirmed?: boolean;
  } = {},
): {
  rights: RightsPolicyBundle;
  auditEvent: ReturnType<typeof compositionRightsChangedEvent> | null;
} {
  const mapped = mapWizardCompositionChoice(choice);
  const base =
    options.previous ??
    createDefaultMachineRightsBundle({
      operatorConfirmedBy: options.confirmed ? options.operator : undefined,
    });

  const before = { ...base.composition };
  const now = new Date().toISOString();

  const rights: RightsPolicyBundle = {
    ...base,
    composition: {
      ...base.composition,
      authorshipStatus: mapped.authorshipStatus,
      publishingRoyaltyStatus: mapped.publishingRoyaltyStatus,
      claimedAuthors:
        mapped.authorshipStatus === "MACHINE_GENERATED_NOT_CLAIMED"
          ? []
          : base.composition.claimedAuthors,
      musicAuthorshipStatus:
        mapped.authorshipStatus === "MACHINE_GENERATED_NOT_CLAIMED"
          ? "MACHINE_GENERATED_NOT_CLAIMED"
          : mapped.authorshipStatus === "HUMAN_AUTHORED"
            ? "HUMAN_AUTHORED"
            : mapped.authorshipStatus === "HUMAN_AI_COLLABORATIVE"
              ? "HUMAN_AI_COLLABORATIVE"
              : "UNDETERMINED",
      policyNote:
        mapped.authorshipStatus === "MACHINE_GENERATED_NOT_CLAIMED"
          ? MACHINE_COMPOSITION_POLICY_NOTE
          : base.composition.policyNote,
      operatorConfirmedAt: options.confirmed ? now : undefined,
      operatorConfirmedBy: options.confirmed ? options.operator : undefined,
    },
    publishingRegistration:
      mapped.authorshipStatus === "MACHINE_GENERATED_NOT_CLAIMED"
        ? false
        : base.publishingRegistration,
    master: {
      ...base.master,
      masterRevenueCollectionStatus:
        PROJECT_RIGHTS_DEFAULTS.DEFAULT_MASTER_REVENUE_COLLECTION,
    },
    aiGenerated:
      mapped.authorshipStatus === "MACHINE_GENERATED_NOT_CLAIMED" ||
      mapped.authorshipStatus === "HUMAN_AI_COLLABORATIVE",
    humanComposition:
      mapped.authorshipStatus === "HUMAN_AUTHORED" ||
      mapped.authorshipStatus === "HUMAN_AI_COLLABORATIVE",
  };

  const changed =
    before.authorshipStatus !== rights.composition.authorshipStatus ||
    before.publishingRoyaltyStatus !==
      rights.composition.publishingRoyaltyStatus;

  return {
    rights,
    auditEvent: changed
      ? compositionRightsChangedEvent({
          before,
          after: rights.composition,
          operator: options.operator,
          reason: `wizard:${choice}`,
        })
      : null,
  };
}

/** Studio labels for public TRACE / UI — factual, unemotional. */
export function publicTraceRightsLabels(
  authorship: CompositionAuthorshipStatus = "MACHINE_GENERATED_NOT_CLAIMED",
): {
  machine: string[];
  human: string[];
  compositionRoyalties: string;
  master: string;
} {
  return {
    machine: ["Genre law", "Audio generation"],
    human: ["System operation", "Selection", "Curation"],
    compositionRoyalties:
      authorship === "MACHINE_GENERATED_NOT_CLAIMED"
        ? "Not claimed"
        : authorship === "UNDETERMINED"
          ? "Pending review"
          : "See release record",
    master: "Commercially released",
  };
}
