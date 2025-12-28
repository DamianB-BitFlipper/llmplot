/**
 * llmplot core library
 * 
 * Pure, browser-compatible chart generation.
 * No file I/O - all assets are bundled inline.
 */

// Preprocessor
export { processModels } from "./preprocessor.js";

// Providers
export { getProviderGroups } from "./providers.js";
export type { ProviderGroup, ProviderEntry } from "./providers.js";

// Assets
export { getIcon } from "./assets.js";

// Renderer
export {
  renderChart,
  calculateLayoutDimensions,
  PADDING_OUTER,
  TARGET_OUTPUT_WIDTH,
} from "./renderer.js";
export type { RenderOptions, RenderMode } from "./renderer.js";

// Types
export type { InputConfig, ModelData, ProcessedModel } from "./types.js";
