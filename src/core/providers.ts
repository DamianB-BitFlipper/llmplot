import type { ProviderConfig } from "./types.js";
import { getIcon } from "./assets.js";

/**
 * Provider configuration with colors.
 * Icons are loaded from bundled assets.
 */
export const providers: Record<string, Omit<ProviderConfig, "iconPath"> & { iconKey: string }> = {
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

const defaultConfig: ProviderConfig = {
  color: "#666666",
};

/**
 * Get provider configuration with fuzzy matching.
 * Matches are case-insensitive and support:
 * 1. Exact match
 * 2. Input starts with key (e.g., "meta-llama" matches "meta")
 * 3. Key starts with input
 * 4. Input contains key or key contains input
 *
 * Throws an error if multiple providers match (ambiguous).
 */
export function getProviderConfig(provider: string): ProviderConfig {
  const input = provider.toLowerCase();
  const keys = Object.keys(providers);

  // 1. Exact match (case-insensitive)
  const exactMatch = keys.find((k) => k.toLowerCase() === input);
  if (exactMatch) {
    const p = providers[exactMatch];
    return { color: p.color, iconSvg: getIcon(p.iconKey) };
  }

  // 2. Fuzzy match
  const matches = keys.filter((k) => {
    const key = k.toLowerCase();
    return (
      input.startsWith(key) ||
      key.startsWith(input) ||
      input.includes(key) ||
      key.includes(input)
    );
  });

  // Error if multiple matches (ambiguous)
  if (matches.length > 1) {
    throw new Error(
      `Ambiguous provider "${provider}" matches multiple: ${matches.join(", ")}`
    );
  }

  // 3. Single fuzzy match found
  if (matches.length === 1) {
    const p = providers[matches[0]];
    return { color: p.color, iconSvg: getIcon(p.iconKey) };
  }

  // 4. No match - fallback with placeholder icon
  return { ...defaultConfig, iconSvg: getIcon(provider) };
}
