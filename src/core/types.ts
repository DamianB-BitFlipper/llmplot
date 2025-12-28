export interface ModelData {
  model: string; // format: provider/model-name (e.g., "anthropic/claude-opus-4.5")
  positive?: number;     // required if percent not set
  total?: number;        // required if percent not set
  percent?: number;      // alternative to positive/total (0-100)
  displayName?: string;  // optional override for display (e.g., "Opus 4.5" instead of "claude-opus-4.5")
  totalParams?: number;  // billions (e.g., 123 for 123B)
  activeParams?: number; // billions (e.g., 32 for 32B) - for MoE models
  color?: string;        // optional hex color override (e.g., "#FF5733")
  icon?: string;         // optional inline SVG string or base64 data URL for custom icon
}

export interface InputConfig {
  title: string;
  subtitle?: string;
  sponsoredBy?: string;
  showRankings: boolean; // default: false
  percentPrecision: number; // default: 0, controls decimal places in percentage display
  font?: string; // optional font family (e.g., "SF Pro"), defaults to system font
  models: ModelData[];
}

export interface ProviderConfig {
  color: string;
  iconSvg?: string; // Inline SVG string for the provider icon
}

export interface ProcessedModel extends ModelData {
  provider: string;      // parsed from model string
  modelName: string;     // parsed from model string
  displayLabel: string;  // displayName if set, otherwise modelName
  percentage: number;
  providerConfig: ProviderConfig;
  rank: number;          // calculated rank with ties (1, 2, 3, 3, 5, 5, 5, 8)
  paramsLabel?: string;  // formatted: "123B Dense" or "355B / 32B Active"
  usePercent: boolean;   // true if percent was used (don't show X/Y in bar)
}
