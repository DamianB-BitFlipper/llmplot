/**
 * llmplot core library
 * 
 * Pure, browser-compatible chart generation.
 * No file I/O - all assets are bundled inline.
 */

// Parser
export { parseYaml, processModels, ParseError } from "./parser.js";

// Renderer
export {
  renderChart,
  calculateLayoutDimensions,
  PADDING_OUTER,
  TARGET_OUTPUT_WIDTH,
} from "./renderer.js";
export type { RenderOptions, RenderMode } from "./renderer.js";

// Types
export type { InputConfig, ProcessedModel } from "./types.js";
