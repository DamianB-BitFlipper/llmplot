import type { ProviderConfig } from "./types.js";
import { getIcon } from "./assets.js";

export interface ProviderEntry {
  color: string;
  iconKey: string;
  group: string;
}

/**
 * Provider configuration with colors and groups.
 * Icons are loaded from bundled assets.
 */
export const providers: Record<string, ProviderEntry> = {
  // Anthropic family
  anthropic: { color: "#DA7757", iconKey: "anthropic", group: "Anthropic" },
  claude: { color: "#DA7757", iconKey: "anthropic", group: "Anthropic" },

  // OpenAI
  openai: { color: "#4BA080", iconKey: "openai", group: "OpenAI" },

  // Google family
  google: { color: "#3186FF", iconKey: "gemini", group: "Google" },
  gemini: { color: "#3186FF", iconKey: "gemini", group: "Google" },

  // Meta family
  meta: { color: "#0DACF1", iconKey: "meta", group: "Meta" },
  "meta-llama": { color: "#0DACF1", iconKey: "meta", group: "Meta" },

  // Mistral family
  mistralai: { color: "#FFAF02", iconKey: "mistral", group: "Mistral" },
  mistral: { color: "#FFAF02", iconKey: "mistral", group: "Mistral" },

  // xAI family
  "x-ai": { color: "#000000", iconKey: "xai", group: "xAI" },
  xai: { color: "#000000", iconKey: "xai", group: "xAI" },

  // Others
  "z-ai": { color: "#3859FF", iconKey: "zhipu", group: "Zhipu" },
  "prime-intellect": { color: "#4D7B4D", iconKey: "prime-intellect", group: "Prime Intellect" },
  qwen: { color: "#6336E8", iconKey: "qwen", group: "Qwen" },
  deepseek: { color: "#4D6BFE", iconKey: "deepseek", group: "DeepSeek" },
  cohere: { color: "#D18EE2", iconKey: "cohere", group: "Cohere" },
};

export interface ProviderGroup {
  group: string;
  key: string;
  iconKey: string;
  color: string;
}

/**
 * Get unique provider groups with their first key.
 * Used for dropdown display.
 */
export function getProviderGroups(): ProviderGroup[] {
  const seen = new Set<string>();
  const groups: ProviderGroup[] = [];

  for (const [key, config] of Object.entries(providers)) {
    if (!seen.has(config.group)) {
      seen.add(config.group);
      groups.push({
        group: config.group,
        key,
        iconKey: config.iconKey,
        color: config.color,
      });
    }
  }

  return groups;
}

export const DEFAULT_COLOR = "#666666";

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
    return { color: p.color, iconUrl: getIcon(p.iconKey) };
  }

  // No match - fallback with placeholder icon
  return { color: DEFAULT_COLOR, iconUrl: getIcon(provider) };
}
