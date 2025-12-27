export interface ModelData {
  model: string; // format: provider/model-name (e.g., "anthropic/claude-opus-4.5")
  positive: number;
  total: number;
  displayName?: string;  // optional override for display (e.g., "Opus 4.5" instead of "claude-opus-4.5")
  totalParams?: number;  // billions (e.g., 123 for 123B)
  activeParams?: number; // billions (e.g., 32 for 32B) - for MoE models
}

export type Orientation = "horizontal" | "vertical";

export interface InputConfig {
  title: string;
  subtitle?: string;
  sponsoredBy?: string;
  orientation?: Orientation;
  models: ModelData[];
}

export interface ProviderConfig {
  color: string;
  iconPath?: string;
}

export interface ProcessedModel extends ModelData {
  provider: string;      // parsed from model string
  modelName: string;     // parsed from model string
  displayLabel: string;  // displayName if set, otherwise modelName
  percentage: number;
  providerConfig: ProviderConfig;
  rank: number;          // calculated rank with ties (1, 2, 3, 3, 5, 5, 5, 8)
  paramsLabel?: string;  // formatted: "123B Dense" or "355B / 32B Active"
}
