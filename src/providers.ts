import type { ProviderConfig } from "./types.js";

/**
 * Provider configuration with colors and icon paths.
 * Fill in the colors and icon paths for each provider.
 */
export const providers: Record<string, ProviderConfig> = {
  anthropic: {
    color: "#DA7757",
    iconPath: "assets/icons/anthropic.svg",
  },
  openai: {
    color: "#4BA080",
    iconPath: "assets/icons/openai.svg",
  },
  google: {
    color: "#3186FF",
    iconPath: "assets/icons/gemini.svg",
  },
  meta: {
    color: "#0DACF1",
    iconPath: "assets/icons/meta.svg",
  },
  mistralai: {
    color: "#FFAF02",
    iconPath: "assets/icons/mistral.svg",
  },
  "x-ai": {
    color: "#000000",
    iconPath: "assets/icons/xai.svg",
  },
  "z-ai": {
    color: "#3859FF",
    iconPath: "assets/icons/zhipu.svg",
  },
  "prime-intellect": {
    color: "#4D7B4D",
    iconPath: "assets/icons/prime-intellect.svg",
  },
  qwen: {
    color: "#6336E8",
    iconPath: "assets/icons/qwen.svg",
  },
  deepseek: {
    color: "#4D6BFE",
    iconPath: "assets/icons/deepseek.svg",
  },
  cohere: {
    color: "#D18EE2",
    iconPath: "assets/icons/cohere.svg",
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
  if (exactMatch) return providers[exactMatch];

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
    return providers[matches[0]];
  }

  // 4. No match - fallback
  return defaultConfig;
}
