import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { processModels, renderChart, calculateLayoutDimensions } from "../../../../src/core/index.js";
import type { InputConfig, ModelData } from "../../../../src/core/index.js";
import type { ChartConfig, ModelConfig, ValidationErrors, CustomProvider } from "./types.js";
import {
  chartConfigToYaml,
  yamlToChartConfig,
  saveConfigToStorage,
  loadConfigFromStorage,
  slugify,
} from "@/lib/config-serializer.js";

// Utilities
function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function createEmptyModel(): ModelConfig {
  return {
    id: generateId(),
    provider: "",
    modelName: "",
    scoreMode: 'fraction',
    passed: "",
    total: "",
    percent: "",
    totalParams: "",
    activeParams: "",
    color: "",
    showAdvanced: false,
  };
}

const defaultModels: ModelConfig[] = [
  {
    id: generateId(),
    provider: "anthropic",
    modelName: "Claude Opus 4.5",
    scoreMode: 'fraction',
    passed: "75",
    total: "100",
    percent: "",
    totalParams: "",
    activeParams: "",
    color: "",
    showAdvanced: false,
  },
  {
    id: generateId(),
    provider: "openai",
    modelName: "GPT 5.2 High",
    scoreMode: 'percent',
    passed: "",
    total: "",
    percent: "74.2",
    totalParams: "",
    activeParams: "",
    color: "",
    showAdvanced: false,
  },
  {
    id: generateId(),
    provider: "google",
    modelName: "Gemini 3 Pro",
    scoreMode: 'percent',
    passed: "",
    total: "",
    percent: "71.8",
    totalParams: "",
    activeParams: "",
    color: "",
    showAdvanced: false,
  },
];

const defaultChartConfig: ChartConfig = {
  title: "Example Benchmark",
  description: "Model Performance Comparison",
  sponsoredBy: "",
  showRankings: false,
  percentPrecision: 0,
  font: "sora",
  models: defaultModels,
  customProviders: [],
};

// Validation
function validateConfig(config: ChartConfig): ValidationErrors {
  const errors: ValidationErrors = { models: {} };

  if (!config.title.trim()) {
    errors.title = "Title is required";
  }

  config.models.forEach((model) => {
    const modelErrors: ValidationErrors['models'][string] = {};

    if (!model.provider.trim()) {
      modelErrors.provider = "Required";
    }

    if (!model.modelName.trim()) {
      modelErrors.modelName = "Required";
    }

    if (model.scoreMode === 'fraction') {
      const passed = parseInt(model.passed, 10);
      const total = parseInt(model.total, 10);

      if (model.passed === "" || isNaN(passed) || passed < 0) {
        modelErrors.passed = "Must be >= 0";
      }
      if (model.total === "" || isNaN(total) || total <= 0) {
        modelErrors.total = "Must be > 0";
      }
      if (!isNaN(passed) && !isNaN(total) && passed > total) {
        modelErrors.passed = "Cannot exceed total";
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

export function formatErrors(errors: ValidationErrors): string[] {
  const messages: string[] = [];
  
  if (errors.title) {
    messages.push("Title is required");
  }
  
  const modelCount = Object.keys(errors.models).length;
  if (modelCount > 0) {
    const isAre = modelCount === 1 ? "is" : "are";
    const entryWord = modelCount === 1 ? "entry" : "entries";
    messages.push(`There ${isAre} ${modelCount} model ${entryWord} with missing or invalid fields`);
  }
  
  return messages;
}

// Convert chart config to InputConfig for renderer
function toRenderConfig(config: ChartConfig): InputConfig {
  const models: ModelData[] = config.models.map((m) => {
    // Find custom provider if this model uses one
    const customProvider = config.customProviders.find(cp => cp.key === m.provider);
    
    // Use provider-only format (no slash needed)
    const base: ModelData = {
      model: m.provider,
    };

    if (m.scoreMode === 'fraction') {
      base.passed = parseInt(m.passed, 10);
      base.total = parseInt(m.total, 10);
    } else {
      base.percent = parseFloat(m.percent);
    }

    // Use the modelName field as displayName
    if (m.modelName.trim()) {
      base.displayName = m.modelName.trim();
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
    title: config.title,
    description: config.description || undefined,
    sponsoredBy: config.sponsoredBy || undefined,
    showRankings: config.showRankings,
    percentPrecision: config.percentPrecision,
    font: config.font,
    models,
  };
}

// Main hook
export function useChartConfig() {
  // Initialize from localStorage, falling back to default config
  const [chartConfig, setChartConfig] = useState<ChartConfig>(() => {
    // Only run on client side
    if (typeof window === "undefined") return defaultChartConfig;
    return loadConfigFromStorage() ?? defaultChartConfig;
  });
  const [errors, setErrors] = useState<ValidationErrors>({ models: {} });
  // Track which fields have been touched by the user
  const [touched, setTouched] = useState<Record<string, Record<string, boolean>>>({});
  // State to force showing all errors (e.g. after download attempt)
  const [showAllErrors, setShowAllErrors] = useState(false);
  
  // null = not yet generated, "" = failed to render, string = valid HTML
  const [chartHtml, setChartHtml] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  // Track the source of the change to use different debounce times
  const changeSourceRef = useRef<'config' | 'resize'>('config');
  
  // Store config in a ref so generateChart doesn't need config as a dependency
  const configRef = useRef<ChartConfig>(chartConfig);
  useEffect(() => {
    configRef.current = chartConfig;
  }, [chartConfig]);

  // Derive a stable fingerprint of only chart-affecting data (excludes UI-only state like showAdvanced and id)
  const chartFingerprint = useMemo(() => {
    const relevantData = {
      title: chartConfig.title,
      description: chartConfig.description,
      sponsoredBy: chartConfig.sponsoredBy,
      showRankings: chartConfig.showRankings,
      percentPrecision: chartConfig.percentPrecision,
      font: chartConfig.font,
      models: chartConfig.models.map(m => ({
        provider: m.provider,
        modelName: m.modelName,
        scoreMode: m.scoreMode,
        passed: m.passed,
        total: m.total,
        percent: m.percent,
        totalParams: m.totalParams,
        activeParams: m.activeParams,
        color: m.color,
      })),
      customProviders: chartConfig.customProviders,
    };
    return JSON.stringify(relevantData);
  }, [chartConfig]);

  // Track container width with ResizeObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      changeSourceRef.current = 'resize';
      setContainerWidth(entries[0].contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const generateChart = useCallback(() => {
    const currentConfig = configRef.current;
    const validationErrors = validateConfig(currentConfig);
    setErrors(validationErrors);

    if (hasErrors(validationErrors)) {
      setChartHtml("");
      return;
    }

    try {
      const renderConfig = toRenderConfig(currentConfig);
      const models = processModels(renderConfig);
      
      const dimensions = calculateLayoutDimensions(models.length, !!renderConfig.description, !!renderConfig.sponsoredBy, renderConfig.showRankings);
      // Cap scale at 1.0 - only scale down, never up
      const scale = containerWidth > 0 ? Math.min(1, containerWidth / dimensions.backgroundWidth) : 1;
      
      const html = renderChart(renderConfig, models, { mode: 'web', scale });
      setChartHtml(html);
    } catch {
      setChartHtml("");
    }
  }, [containerWidth]);

  // Track last change time for leading-edge debounce
  const lastChangeTimeRef = useRef<number>(0);
  const isWaitingRef = useRef<boolean>(false);

  // Re-render chart when container width changes or chart-affecting data changes
  // Leading-edge debounce: render immediately on first change, then batch until pause
  // Uses different debounce times: 250ms for resize events, 100ms for config changes
  useEffect(() => {
    if (containerWidth > 0) {
      const now = Date.now();
      const timeSinceLastChange = now - lastChangeTimeRef.current;
      lastChangeTimeRef.current = now;
      
      // Use different debounce times based on change source
      const debounceMs = changeSourceRef.current === 'resize' ? 250 : 100;

      const doRender = () => {
        isWaitingRef.current = false;
        changeSourceRef.current = 'config'; // Reset to default after render
        generateChart();
        setIsGenerating(false);
      };

      // If not currently waiting and last change was > debounceMs ago, render immediately
      if (!isWaitingRef.current && timeSinceLastChange > debounceMs) {
        doRender();
        return;
      }

      // Otherwise, debounce: wait for pause before rendering
      isWaitingRef.current = true;

      // Only show loading indicator if render takes longer than 250ms
      const loadingTimeout = setTimeout(() => {
        setIsGenerating(true);
      }, 250);
      
      const renderTimeout = setTimeout(() => {
        clearTimeout(loadingTimeout);
        doRender();
      }, debounceMs);
      
      return () => {
        clearTimeout(loadingTimeout);
        clearTimeout(renderTimeout);
      };
    }
  }, [containerWidth, chartFingerprint, generateChart]);

  // Auto-save to localStorage when config changes (debounced)
  useEffect(() => {
    const timeout = setTimeout(() => {
      saveConfigToStorage(chartConfig);
    }, 500);
    return () => clearTimeout(timeout);
  }, [chartFingerprint]);

  // Export config as YAML string
  const exportYaml = useCallback((): string => {
    return chartConfigToYaml(configRef.current);
  }, []);

  // Export YAML and trigger download
  const downloadYaml = useCallback(() => {
    const yaml = chartConfigToYaml(configRef.current);
    const filename = `${slugify(configRef.current.title)}.yaml`;
    
    const blob = new Blob([yaml], { type: "text/yaml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  // Import config from YAML string
  // Returns { success: true } or { success: false, error: string }
  const importYaml = useCallback((yamlString: string): { success: boolean; error?: string } => {
    try {
      const newConfig = yamlToChartConfig(yamlString);
      setChartConfig(newConfig);
      setTouched({});
      setShowAllErrors(false);
      return { success: true };
    } catch (e) {
      const error = e instanceof Error ? e.message : "Failed to parse YAML";
      return { success: false, error };
    }
  }, []);

  const markTouched = useCallback((modelId: string, field: string) => {
    setTouched((prev) => ({
      ...prev,
      [modelId]: { ...(prev[modelId] || {}), [field]: true }
    }));
  }, []);

  const downloadHtml = useCallback(() => {
    const currentConfig = configRef.current;
    const validationErrors = validateConfig(currentConfig);
    if (hasErrors(validationErrors)) {
      setErrors(validationErrors);
      setShowAllErrors(true);
      return;
    }

    try {
      const renderConfig = toRenderConfig(currentConfig);
      const models = processModels(renderConfig);
      const html = renderChart(renderConfig, models, { mode: 'web' });
      
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
  }, []);

  const updateConfig = useCallback((updates: Partial<ChartConfig>) => {
    setChartConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  const updateModel = useCallback((id: string, updates: Partial<ModelConfig>) => {
    setChartConfig((prev) => ({
      ...prev,
      models: prev.models.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    }));
  }, []);

  const addModel = useCallback(() => {
    setShowAllErrors(false);
    setChartConfig((prev) => ({
      ...prev,
      models: [createEmptyModel(), ...prev.models],
    }));
  }, []);

  const removeModel = useCallback((id: string) => {
    setChartConfig((prev) => {
      if (prev.models.length <= 1) return prev;
      return {
        ...prev,
        models: prev.models.filter((m) => m.id !== id),
      };
    });
  }, []);

  const addCustomProvider = useCallback((provider: CustomProvider) => {
    setChartConfig((prev) => ({
      ...prev,
      customProviders: [...prev.customProviders, provider],
    }));
  }, []);

  const removeCustomProvider = useCallback((key: string) => {
    setChartConfig((prev) => ({
      ...prev,
      customProviders: prev.customProviders.filter((p) => p.key !== key),
      // Also clear the provider from any models using it
      models: prev.models.map((m) =>
        m.provider === key ? { ...m, provider: "" } : m
      ),
    }));
  }, []);

  const restoreSampleData = useCallback(() => {
    // Restore default config with fresh IDs for each model
    setChartConfig({
      ...defaultChartConfig,
      // Fresh objects & IDs to avoid reference sharing and React key collisions
      models: defaultModels.map((m) => ({ ...m, id: generateId() })),
    });
    setTouched({});
    setShowAllErrors(false);
  }, []);

  return {
    chartConfig,
    errors,
    touched,
    showAllErrors,
    markTouched,
    chartHtml,
    isGenerating,
    containerRef,
    updateConfig,
    updateModel,
    addModel,
    removeModel,
    addCustomProvider,
    removeCustomProvider,
    downloadHtml,
    exportYaml,
    downloadYaml,
    importYaml,
    restoreSampleData,
  };
}
