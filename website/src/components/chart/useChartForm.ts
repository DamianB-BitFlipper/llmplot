import { useState, useRef, useEffect, useCallback } from "react";
import { processModels, renderChart, calculateLayoutDimensions } from "../../../../src/core/index.js";
import type { InputConfig, ModelData } from "../../../../src/core/index.js";
import type { FormState, ModelFormData, ValidationErrors, CustomProvider } from "./types.js";

// Utilities
function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function createEmptyModel(): ModelFormData {
  return {
    id: generateId(),
    provider: "",
    modelName: "",
    scoreMode: 'fraction',
    positive: "",
    total: "",
    percent: "",
    displayName: "",
    totalParams: "",
    activeParams: "",
    color: "",
    showAdvanced: false,
  };
}

const defaultModels: ModelFormData[] = [
  {
    id: generateId(),
    provider: "openai",
    modelName: "gpt-4o",
    scoreMode: 'fraction',
    positive: "92",
    total: "100",
    percent: "",
    displayName: "",
    totalParams: "",
    activeParams: "",
    color: "",
    showAdvanced: false,
  },
  {
    id: generateId(),
    provider: "anthropic",
    modelName: "claude-3.5-sonnet",
    scoreMode: 'fraction',
    positive: "89",
    total: "100",
    percent: "",
    displayName: "",
    totalParams: "",
    activeParams: "",
    color: "",
    showAdvanced: false,
  },
  {
    id: generateId(),
    provider: "gemini",
    modelName: "gemini-2.0-flash",
    scoreMode: 'fraction',
    positive: "85",
    total: "100",
    percent: "",
    displayName: "",
    totalParams: "",
    activeParams: "",
    color: "",
    showAdvanced: false,
  },
];

const defaultFormState: FormState = {
  title: "Example Benchmark",
  subtitle: "Model Performance Comparison",
  sponsoredBy: "",
  showRankings: false,
  percentPrecision: 0,
  font: "",
  models: defaultModels,
  customProviders: [],
};

// Validation
function validateForm(form: FormState): ValidationErrors {
  const errors: ValidationErrors = { models: {} };

  if (!form.title.trim()) {
    errors.title = "Title is required";
  }

  form.models.forEach((model) => {
    const modelErrors: ValidationErrors['models'][string] = {};

    if (!model.provider.trim()) {
      modelErrors.provider = "Required";
    }

    if (!model.modelName.trim()) {
      modelErrors.modelName = "Required";
    }

    if (model.scoreMode === 'fraction') {
      const positive = parseInt(model.positive, 10);
      const total = parseInt(model.total, 10);

      if (model.positive === "" || isNaN(positive) || positive < 0) {
        modelErrors.positive = "Must be >= 0";
      }
      if (model.total === "" || isNaN(total) || total <= 0) {
        modelErrors.total = "Must be > 0";
      }
      if (!isNaN(positive) && !isNaN(total) && positive > total) {
        modelErrors.positive = "Cannot exceed total";
      }
    } else {
      const percent = parseFloat(model.percent);
      if (model.percent === "" || isNaN(percent) || percent < 0 || percent > 100) {
        modelErrors.percent = "Must be 0-100";
      }
    }

    if (model.totalParams) {
      const params = parseInt(model.totalParams, 10);
      if (isNaN(params) || params <= 0) {
        modelErrors.totalParams = "Must be > 0";
      }
    }

    if (model.activeParams) {
      const params = parseInt(model.activeParams, 10);
      if (isNaN(params) || params <= 0) {
        modelErrors.activeParams = "Must be > 0";
      }
    }

    if (model.color && !/^#[0-9A-Fa-f]{6}$/.test(model.color)) {
      modelErrors.color = "Invalid hex (e.g., #FF5733)";
    }

    if (Object.keys(modelErrors).length > 0) {
      errors.models[model.id] = modelErrors;
    }
  });

  return errors;
}

export function hasErrors(errors: ValidationErrors): boolean {
  return !!errors.title || Object.keys(errors.models).length > 0;
}

// Convert form state to InputConfig
function formToConfig(form: FormState): InputConfig {
  const models: ModelData[] = form.models.map((m) => {
    // Find custom provider if this model uses one
    const customProvider = form.customProviders.find(cp => cp.key === m.provider);
    
    const base: ModelData = {
      model: `${m.provider}/${m.modelName}`,
    };

    if (m.scoreMode === 'fraction') {
      base.positive = parseInt(m.positive, 10);
      base.total = parseInt(m.total, 10);
    } else {
      base.percent = parseFloat(m.percent);
    }

    if (m.displayName.trim()) {
      base.displayName = m.displayName.trim();
    }
    if (m.totalParams) {
      base.totalParams = parseInt(m.totalParams, 10);
    }
    if (m.activeParams) {
      base.activeParams = parseInt(m.activeParams, 10);
    }
    
    // Use model's color override, or custom provider's color
    if (m.color) {
      base.color = m.color;
    } else if (customProvider?.color) {
      base.color = customProvider.color;
    }
    
    // Use custom provider's icon if available
    if (customProvider?.iconDataUrl) {
      base.iconDataUrl = customProvider.iconDataUrl;
    }

    return base;
  });

  return {
    title: form.title,
    subtitle: form.subtitle || undefined,
    sponsoredBy: form.sponsoredBy || undefined,
    showRankings: form.showRankings,
    percentPrecision: form.percentPrecision,
    font: form.font || undefined,
    models,
  };
}

// Main hook
export function useChartForm() {
  const [form, setForm] = useState<FormState>(defaultFormState);
  const [errors, setErrors] = useState<ValidationErrors>({ models: {} });
  const [chartHtml, setChartHtml] = useState<string>("");
  const [containerWidth, setContainerWidth] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Track container width with ResizeObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const generateChart = useCallback(() => {
    const validationErrors = validateForm(form);
    setErrors(validationErrors);

    if (hasErrors(validationErrors)) {
      setChartHtml("");
      return;
    }

    try {
      const config = formToConfig(form);
      const models = processModels(config);
      
      const dimensions = calculateLayoutDimensions(models.length, !!config.subtitle, !!config.sponsoredBy);
      const scale = containerWidth > 0 ? containerWidth / dimensions.backgroundWidth : 1;
      
      const html = renderChart(config, models, { mode: 'web', scale });
      setChartHtml(html);
    } catch {
      setChartHtml("");
    }
  }, [form, containerWidth]);

  // Re-render chart when container width changes or form changes (debounced)
  useEffect(() => {
    if (containerWidth > 0) {
      setIsGenerating(true);
      const timeout = setTimeout(() => {
        generateChart();
        setIsGenerating(false);
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [containerWidth, form, generateChart]);

  const downloadHtml = useCallback(() => {
    const validationErrors = validateForm(form);
    if (hasErrors(validationErrors)) {
      setErrors(validationErrors);
      return;
    }

    try {
      const config = formToConfig(form);
      const models = processModels(config);
      const html = renderChart(config, models, { mode: 'web' });
      
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "chart.html";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Ignore errors during download
    }
  }, [form]);

  const updateForm = useCallback((updates: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  }, []);

  const updateModel = useCallback((id: string, updates: Partial<ModelFormData>) => {
    setForm((prev) => ({
      ...prev,
      models: prev.models.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    }));
  }, []);

  const addModel = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      models: [...prev.models, createEmptyModel()],
    }));
  }, []);

  const removeModel = useCallback((id: string) => {
    setForm((prev) => {
      if (prev.models.length <= 1) return prev;
      return {
        ...prev,
        models: prev.models.filter((m) => m.id !== id),
      };
    });
  }, []);

  const addCustomProvider = useCallback((provider: CustomProvider) => {
    setForm((prev) => ({
      ...prev,
      customProviders: [...prev.customProviders, provider],
    }));
  }, []);

  return {
    form,
    errors,
    chartHtml,
    isGenerating,
    containerRef,
    updateForm,
    updateModel,
    addModel,
    removeModel,
    addCustomProvider,
    downloadHtml,
  };
}
