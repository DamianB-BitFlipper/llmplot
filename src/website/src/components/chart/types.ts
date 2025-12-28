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
export const fontFamilies = ["geist", "geist-mono", "ibm-plex-sans", "inter", "libre-baskerville", "manrope", "sora", "space-grotesk"] as const;
export type FontFamily = typeof fontFamilies[number];

/** Font configuration with display names and CSS values */
export const fontConfig: Record<FontFamily, { display: string; css: string }> = {
  "geist": { display: "Geist", css: "'Geist', sans-serif" },
  "geist-mono": { display: "Geist Mono", css: "'Geist Mono', monospace" },
  "ibm-plex-sans": { display: "IBM Plex Sans", css: "'IBM Plex Sans', sans-serif" },
  "inter": { display: "Inter", css: "'Inter', sans-serif" },
  "libre-baskerville": { display: "Libre Baskerville", css: "'Libre Baskerville', serif" },
  "manrope": { display: "Manrope", css: "'Manrope', sans-serif" },
  "sora": { display: "Sora", css: "'Sora', sans-serif" },
  "space-grotesk": { display: "Space Grotesk", css: "'Space Grotesk', sans-serif" },
};

export interface ChartConfig {
  title: string;
  description: string;
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
