import type { ProviderConfig } from "./types.js";
import { getIcon } from "./assets.js";

/**
 * Provider configuration with colors.
 * Icons are loaded from bundled assets.
 */
export const providers: Record<string, { color: string; iconKey: string }> = {
  anthropic: {
    color: "#DA7757",
    iconKey: "anthropic",
  },
  openai: {
    color: "#4BA080",
    iconKey: "openai",
  },
  google: {
    color: "#3186FF",
    iconKey: "gemini",
  },
  meta: {
    color: "#0DACF1",
    iconKey: "meta",
  },
  mistralai: {
    color: "#FFAF02",
    iconKey: "mistral",
  },
  "x-ai": {
    color: "#000000",
    iconKey: "xai",
  },
  "z-ai": {
    color: "#3859FF",
    iconKey: "zhipu",
  },
  "prime-intellect": {
    color: "#4D7B4D",
    iconKey: "prime-intellect",
  },
  qwen: {
    color: "#6336E8",
    iconKey: "qwen",
  },
  deepseek: {
    color: "#4D6BFE",
    iconKey: "deepseek",
  },
  cohere: {
    color: "#D18EE2",
    iconKey: "cohere",
  },
};

const DEFAULT_COLOR = "#666666";

/**
 * Get provider configuration with contains matching.
 * Matches the first provider key contained in the input (case-insensitive).
 * e.g., "meta-llama/model" matches "meta", "anthropic/claude" matches "anthropic"
 */
export function getProviderConfig(provider: string): ProviderConfig {
  const input = provider.toLowerCase();

  const match = Object.keys(providers).find((k) => input.includes(k.toLowerCase()));
  if (match) {
    const p = providers[match];
    return { color: p.color, iconSvg: getIcon(p.iconKey) };
  }

  // No match - fallback with placeholder icon
  return { color: DEFAULT_COLOR, iconSvg: getIcon(provider) };
}
