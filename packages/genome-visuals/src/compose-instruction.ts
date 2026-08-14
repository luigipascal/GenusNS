import type { ExperimentLaw } from "./types";

/**
 * Locked Compose instruction derived from the experiment law (`{}`).
 * Genus desktop must generate the published master from this brief —
 * not from unrelated “original” source tracks or Web Audio previews.
 */
export interface ComposeInstruction {
  schema: "genusns.compose-instruction.v1";
  digest: string;
  canonicalId: string;
  title: string;
  /** Single locked prompt for Foundry / ACE / Compose. */
  prompt: string;
  duration_ms: number | null;
  bpm: number;
  key: string;
  structure: string[];
  voices: string[];
  constraints: string[];
}

export function composeInstructionFromLaw(
  experiment: ExperimentLaw,
): ComposeInstruction {
  const [k, n] = experiment.euclidean;
  const degrees = experiment.allowedDegrees.join(",");
  const accents = [...experiment.accentResidues].sort((a, b) => a - b);
  const path = experiment.formPath.length
    ? experiment.formPath
    : experiment.form.nodes;

  const prompt = [
    `Multi-voice instrumental in mathematical genre ${experiment.name}.`,
    `${experiment.edo}-EDO lattice degrees ${degrees}.`,
    `Meter cycle ${experiment.cycleLength} with accents [${accents.join(", ")}].`,
    `Euclidean(${k},${n}) + dense groove.`,
    `Form path: ${path.join(" → ")}.`,
    "Voices: pulse/groove/bass/melody/harmony.",
    `Spectral centroid~${experiment.spectral.centroid}, inharmonicity=${experiment.spectral.inharmonicity}.`,
    experiment.rhythmRule ? `Rhythm rule: ${experiment.rhythmRule}.` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return {
    schema: "genusns.compose-instruction.v1",
    digest: experiment.digest,
    canonicalId: experiment.canonicalId,
    title: experiment.name,
    prompt,
    duration_ms:
      experiment.loopSec && experiment.loopSec > 0
        ? Math.round(experiment.loopSec * 1000)
        : null,
    bpm: experiment.bpm,
    key: `EDO${experiment.edo}`,
    structure: path,
    voices: ["pulse", "groove", "bass", "melody", "harmony"],
    constraints: [
      "Master must be generated in Genus Compose from this instruction (or the compiled pack foundry_brief/prompts).",
      "Do not publish raw source material, Foundry demos, or Web Audio genome auditions as the track.",
      "Refine may change performance only; composition/arrangement stay bound to this law.",
    ],
  };
}
