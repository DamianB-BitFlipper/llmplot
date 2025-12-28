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
export type { RenderOptions } from "./renderer.js";

// Types
export type {
  InputConfig,
  ModelData,
  ProcessedModel,
  ProviderConfig,
} from "./types.js";

// Assets (for advanced use cases)
export { icons, geistFontBase64, getIcon } from "./assets.js";

// Providers (for advanced use cases)
export { providers, getProviderConfig } from "./providers.js";
