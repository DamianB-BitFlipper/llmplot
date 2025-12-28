import { useState, useRef, useEffect } from "react";
import { Download, ChevronDown, ChevronRight, Plus, X } from "lucide-react";
import { processModels, renderChart, calculateLayoutDimensions } from "../../../src/core/index.js";
import type { InputConfig, ModelData } from "../../../src/core/index.js";

// Form state types
interface ModelFormData {
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

interface FormState {
  title: string;
  subtitle: string;
  sponsoredBy: string;
  showRankings: boolean;
  percentPrecision: number;
  font: string;
  models: ModelFormData[];
}

interface ValidationErrors {
  title?: string;
  models: Record<string, {
    provider?: string;
    modelName?: string;
    positive?: string;
    total?: string;
    percent?: string;
    totalParams?: string;
    activeParams?: string;
    color?: string;
  }>;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function createEmptyModel(): ModelFormData {
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
};

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

function hasErrors(errors: ValidationErrors): boolean {
  return !!errors.title || Object.keys(errors.models).length > 0;
}

function formToConfig(form: FormState): InputConfig {
  const models: ModelData[] = form.models.map((m) => {
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
    if (m.color) {
      base.color = m.color;
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

export default function ChartGenerator() {
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
  }, [containerWidth, form]);

  const generateChart = () => {
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
  };

  const downloadHtml = () => {
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
  };

  const updateModel = (id: string, updates: Partial<ModelFormData>) => {
    setForm((prev) => ({
      ...prev,
      models: prev.models.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    }));
  };

  const addModel = () => {
    setForm((prev) => ({
      ...prev,
      models: [...prev.models, createEmptyModel()],
    }));
  };

  const removeModel = (id: string) => {
    if (form.models.length <= 1) return;
    setForm((prev) => ({
      ...prev,
      models: prev.models.filter((m) => m.id !== id),
    }));
  };

  const inputClass = (hasError: boolean) =>
    `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
      hasError ? "border-red-500 bg-red-50" : "border-gray-300"
    }`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Form Panel */}
      <div className="space-y-6">
        {/* Header Section */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              className={inputClass(!!errors.title)}
              placeholder="Benchmark Title"
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
            <input
              type="text"
              value={form.subtitle}
              onChange={(e) => setForm((prev) => ({ ...prev, subtitle: e.target.value }))}
              className={inputClass(false)}
              placeholder="Optional description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sponsored By</label>
            <input
              type="text"
              value={form.sponsoredBy}
              onChange={(e) => setForm((prev) => ({ ...prev, sponsoredBy: e.target.value }))}
              className={inputClass(false)}
              placeholder="Optional sponsor"
            />
          </div>
        </div>

        {/* Options Section */}
        <div className="flex flex-wrap gap-4 items-center p-4 bg-gray-50 rounded-lg">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.showRankings}
              onChange={(e) => setForm((prev) => ({ ...prev, showRankings: e.target.checked }))}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Show Rankings</span>
          </label>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700">Precision:</label>
            <select
              value={form.percentPrecision}
              onChange={(e) => setForm((prev) => ({ ...prev, percentPrecision: parseInt(e.target.value, 10) }))}
              className="px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value={0}>0</option>
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700">Font:</label>
            <input
              type="text"
              value={form.font}
              onChange={(e) => setForm((prev) => ({ ...prev, font: e.target.value }))}
              className="w-32 px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="System default"
            />
          </div>
        </div>

        {/* Models Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Models</h3>
          
          {form.models.map((model, index) => {
            const modelErrors = errors.models[model.id] || {};
            
            return (
              <div key={model.id} className="p-4 border border-gray-200 rounded-lg space-y-3 bg-white">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Model {index + 1}</span>
                  {form.models.length > 1 && (
                    <button
                      onClick={() => removeModel(model.id)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      title="Remove model"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Provider</label>
                    <input
                      type="text"
                      value={model.provider}
                      onChange={(e) => updateModel(model.id, { provider: e.target.value })}
                      className={inputClass(!!modelErrors.provider)}
                      placeholder="e.g., openai"
                    />
                    {modelErrors.provider && <p className="mt-1 text-xs text-red-600">{modelErrors.provider}</p>}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Model Name</label>
                    <input
                      type="text"
                      value={model.modelName}
                      onChange={(e) => updateModel(model.id, { modelName: e.target.value })}
                      className={inputClass(!!modelErrors.modelName)}
                      placeholder="e.g., gpt-4o"
                    />
                    {modelErrors.modelName && <p className="mt-1 text-xs text-red-600">{modelErrors.modelName}</p>}
                  </div>
                </div>

                {/* Score Mode */}
                <div className="space-y-2">
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={model.scoreMode === 'fraction'}
                        onChange={() => updateModel(model.id, { scoreMode: 'fraction' })}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Fraction</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={model.scoreMode === 'percent'}
                        onChange={() => updateModel(model.id, { scoreMode: 'percent' })}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Percent</span>
                    </label>
                  </div>

                  {model.scoreMode === 'fraction' ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Positive</label>
                        <input
                          type="number"
                          value={model.positive}
                          onChange={(e) => updateModel(model.id, { positive: e.target.value })}
                          className={inputClass(!!modelErrors.positive)}
                          placeholder="e.g., 92"
                          min="0"
                        />
                        {modelErrors.positive && <p className="mt-1 text-xs text-red-600">{modelErrors.positive}</p>}
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Total</label>
                        <input
                          type="number"
                          value={model.total}
                          onChange={(e) => updateModel(model.id, { total: e.target.value })}
                          className={inputClass(!!modelErrors.total)}
                          placeholder="e.g., 100"
                          min="1"
                        />
                        {modelErrors.total && <p className="mt-1 text-xs text-red-600">{modelErrors.total}</p>}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Percent</label>
                      <input
                        type="number"
                        value={model.percent}
                        onChange={(e) => updateModel(model.id, { percent: e.target.value })}
                        className={inputClass(!!modelErrors.percent)}
                        placeholder="e.g., 92"
                        min="0"
                        max="100"
                        step="0.1"
                      />
                      {modelErrors.percent && <p className="mt-1 text-xs text-red-600">{modelErrors.percent}</p>}
                    </div>
                  )}
                </div>

                {/* Advanced Section */}
                <div>
                  <button
                    type="button"
                    onClick={() => updateModel(model.id, { showAdvanced: !model.showAdvanced })}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                  >
                    {model.showAdvanced ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    Advanced
                  </button>

                  {model.showAdvanced && (
                    <div className="mt-3 space-y-3 pl-5 border-l-2 border-gray-200">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Display Name</label>
                        <input
                          type="text"
                          value={model.displayName}
                          onChange={(e) => updateModel(model.id, { displayName: e.target.value })}
                          className={inputClass(false)}
                          placeholder="Override display label"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Total Params (B)</label>
                          <input
                            type="number"
                            value={model.totalParams}
                            onChange={(e) => updateModel(model.id, { totalParams: e.target.value })}
                            className={inputClass(!!modelErrors.totalParams)}
                            placeholder="e.g., 175"
                            min="1"
                          />
                          {modelErrors.totalParams && <p className="mt-1 text-xs text-red-600">{modelErrors.totalParams}</p>}
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Active Params (B)</label>
                          <input
                            type="number"
                            value={model.activeParams}
                            onChange={(e) => updateModel(model.id, { activeParams: e.target.value })}
                            className={inputClass(!!modelErrors.activeParams)}
                            placeholder="e.g., 32"
                            min="1"
                          />
                          {modelErrors.activeParams && <p className="mt-1 text-xs text-red-600">{modelErrors.activeParams}</p>}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Color Override</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={model.color}
                            onChange={(e) => updateModel(model.id, { color: e.target.value })}
                            className={`flex-1 ${inputClass(!!modelErrors.color)}`}
                            placeholder="#FF5733"
                          />
                          <input
                            type="color"
                            value={model.color || "#000000"}
                            onChange={(e) => updateModel(model.id, { color: e.target.value })}
                            className="w-10 h-10 p-1 border border-gray-300 rounded-lg cursor-pointer"
                          />
                        </div>
                        {modelErrors.color && <p className="mt-1 text-xs text-red-600">{modelErrors.color}</p>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          <button
            onClick={addModel}
            className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Model
          </button>
        </div>
      </div>

      {/* Preview Panel */}
      <div>
        <div 
          ref={containerRef}
          className="sticky top-4 relative border border-gray-300 rounded-lg overflow-hidden"
        >
          {isGenerating && (
            <div className="absolute inset-0 bg-gray-500/20 z-20" />
          )}
          {chartHtml && (
            <button
              onClick={downloadHtml}
              className="absolute top-3 right-3 p-2 bg-white/80 hover:bg-white rounded-lg shadow-sm border border-gray-200 transition-colors z-10"
              title="Download HTML"
            >
              <Download className="w-5 h-5 text-gray-600" />
            </button>
          )}
          {chartHtml ? (
            <div 
              id="chart-preview"
              dangerouslySetInnerHTML={{ __html: chartHtml }} 
            />
          ) : (
            <div className="text-gray-500 p-8 text-center bg-gray-50 min-h-64 flex items-center justify-center">
              {hasErrors(errors) ? "Fix validation errors to preview" : "Enter data to preview chart"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
