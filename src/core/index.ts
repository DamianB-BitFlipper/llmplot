/**
 * llmplot core library
 * 
 * Pure, browser-compatible chart generation.
 * No file I/O - all assets are bundled inline.
 */

// Parser
export { processModels } from "./parser.js";

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
