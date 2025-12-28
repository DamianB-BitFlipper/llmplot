// Form state types for the chart generator

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
