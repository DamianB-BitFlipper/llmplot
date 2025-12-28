// Chart configuration types for the chart generator

export interface CustomProvider {
  key: string;        // auto-generated from name, e.g., "my-provider"
  name: string;       // display name, e.g., "My Provider"
  color: string;      // hex color
  iconDataUrl?: string; // optional base64 data URL for uploaded SVG/PNG
}

export interface ModelConfig {
  id: string;
  provider: string;
  modelName: string;  // Display name for the model (shown in chart)
  scoreMode: 'fraction' | 'percent';
  passed: string;
  total: string;
  percent: string;
  totalParams: string;
  activeParams: string;
  color: string;
  showAdvanced: boolean;
}

/** Available font families */
export const fontFamilies = ["geist", "ibm-plex-sans", "inter", "libre-baskerville", "manrope", "sora", "space-grotesk"] as const;
export type FontFamily = typeof fontFamilies[number];

/** Map font family keys to display names */
export const fontDisplayNames: Record<FontFamily, string> = {
  "geist": "Geist",
  "ibm-plex-sans": "IBM Plex Sans",
  "inter": "Inter",
  "libre-baskerville": "Libre Baskerville",
  "manrope": "Manrope",
  "sora": "Sora",
  "space-grotesk": "Space Grotesk",
};

export interface ChartConfig {
  title: string;
  subtitle: string;
  sponsoredBy: string;
  showRankings: boolean;
  percentPrecision: number;
  font: FontFamily;
  models: ModelConfig[];
  customProviders: CustomProvider[];
}

export interface ModelValidationErrors {
  provider?: string;
  modelName?: string;
  passed?: string;
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
