export interface ModelData {
  model: string; // format: provider/model-name (e.g., "anthropic/claude-opus-4.5")
  positive: number;
  total: number;
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
  provider: string; // parsed from model string
  modelName: string; // parsed from model string  
  percentage: number;
  providerConfig: ProviderConfig;
}
