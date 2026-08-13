export { VISUAL_PROFILE_VERSION } from "./types";
export type {
  ExperimentLaw,
  ExperimentPalette,
  GenomeVisualProfile,
  VisualEdge,
} from "./types";

export { createSeededRng, digestBytes, floatFromDigest } from "./seed";
export { euclideanPattern } from "./euclidean";
export { createExperimentPalette } from "./palette";
export { createGenomeVisualProfile } from "./profile";
export { renderGenomeGlyphSvg } from "./glyph";
export type { GlyphRenderOptions } from "./glyph";
export {
  renderRhythmOrbitSvg,
  renderPitchLatticeSvg,
  renderFormGraphSvg,
  renderSpectralSurfaceSvg,
} from "./projections";
export type { ProjectionOptions, RhythmOrbitOptions } from "./projections";
export { interpolateVisualProfiles } from "./interpolate";
export {
  parameterDistance,
  parameterVector,
  findNearExperiments,
  findFarExperiments,
  pickRandomSpecies,
} from "./distance";

export { experiment288fbd } from "./fixtures/288fbd";
export {
  experimentCatalog,
  listExperiments,
  resolveExperiment,
  getFeaturedExperiment,
} from "./fixtures/catalog";
