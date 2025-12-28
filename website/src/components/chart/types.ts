// Form state types for the chart generator

export interface CustomProvider {
  key: string;        // auto-generated from name, e.g., "my-provider"
  name: string;       // display name, e.g., "My Provider"
  color: string;      // hex color
  iconDataUrl?: string; // optional base64 data URL for uploaded SVG/PNG
}

export interface ModelFormData {
  id: string;
  provider: string;
  modelName: string;
  scoreMode: 'fraction' | 'percent';
  positive: string;
  total: string;
  percent: string;
  displayName: string;
  totalParams: string;
  activeParams: string;
  color: string;
  showAdvanced: boolean;
}

export interface FormState {
  title: string;
  subtitle: string;
  sponsoredBy: string;
  showRankings: boolean;
  percentPrecision: number;
  font: string;
  models: ModelFormData[];
  customProviders: CustomProvider[];
}

export interface ModelValidationErrors {
  provider?: string;
  modelName?: string;
  positive?: string;
  total?: string;
  percent?: string;
  totalParams?: string;
  activeParams?: string;
  color?: string;
}

export interface ValidationErrors {
  title?: string;
  models: Record<string, ModelValidationErrors>;
}
