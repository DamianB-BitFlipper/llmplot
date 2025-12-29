export interface ModelData {
  model: string; // format: provider or provider/model-name (e.g., "anthropic" or "anthropic/claude-opus-4.5")
  passed?: number;       // required if percent not set
  total?: number;        // required if percent not set
  percent?: number;      // alternative to passed/total (0-100)
  displayName?: string;  // optional override for display (e.g., "Opus 4.5" instead of "claude-opus-4.5")
  totalParams?: number;  // billions (e.g., 123 for 123B)
  activeParams?: number; // billions (e.g., 32 for 32B) - for MoE models
  color?: string;        // optional hex color override (e.g., "#FF5733")
  iconDataUrl?: string;  // optional base64 data URL for custom icon (data:image/svg+xml;base64,... or data:image/png;base64,...)
}

/**
 * Custom provider definition for use in YAML config.
 * Allows defining new providers beyond the built-in ones.
 */
export interface CustomProvider {
  key: string;           // provider key used in model strings (e.g., "my-company")
  color: string;         // hex color (e.g., "#FF5733")
  iconDataUrl?: string;  // base64 data URL for icon (resolved from file path in CLI)
}

import type { FontFamily } from "./assets.js";

export interface InputConfig {
  title: string;
  description?: string;
  sponsoredBy?: string;
  showRankings: boolean; // default: false
  percentPrecision: number; // default: 1, controls decimal places in percentage display
  font?: FontFamily; // optional font family, defaults to "sora"
  customProviders?: CustomProvider[]; // optional custom provider definitions
  models: ModelData[];
}

export interface ProviderConfig {
  color: string;
  iconUrl?: string; // URL to the provider icon (bundled asset)
}

export interface ProcessedModel extends ModelData {
  provider: string;      // parsed from model string
  modelName?: string;    // parsed from model string (undefined if provider-only)
  displayLabel: string;  // displayName if set, otherwise modelName, otherwise provider
  percentage: number;
  providerConfig: ProviderConfig;
  rank: number;          // calculated rank with ties (1, 2, 3, 3, 5, 5, 5, 8)
  paramsLabel?: string;  // formatted: "123B Dense" or "355B / 32B Active"
  usePercent: boolean;   // true if percent was used (don't show X/Y in bar)
}
