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
    color: "#888888",
    iconPath: "assets/icons/openai.svg",
  },
  google: {
    color: "#888888",
    iconPath: "assets/icons/gemini.svg",
  },
  meta: {
    color: "#888888",
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
    color: "#888888",
    iconPath: "assets/icons/deepseek.svg",
  },
  cohere: {
    color: "#888888",
    iconPath: "assets/icons/cohere.svg",
  },
};

const defaultConfig: ProviderConfig = {
  color: "#666666",
};

/**
 * Get provider configuration, falling back to defaults for unknown providers.
 */
export function getProviderConfig(provider: string): ProviderConfig {
  const normalized = provider.toLowerCase();
  return providers[normalized] ?? defaultConfig;
}
