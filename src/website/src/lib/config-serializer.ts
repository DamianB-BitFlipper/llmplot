import { stringify, parse } from "yaml";
import type { ChartConfig, ModelConfig, CustomProvider, FontFamily } from "@/components/chart/types";
import { parseScore } from "@/components/chart/useChartConfig";

const STORAGE_KEY = "llmplot-config";

// Valid font families (must match core/types.ts)
const validFonts = new Set([
  "geist", "geist-mono", "ibm-plex-sans", "inter",
  "libre-baskerville", "manrope", "sora", "space-grotesk"
]);

/**
 * Generate a unique ID for models
 */
function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Slugify a string for use as a filename
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "chart";
}

/**
 * YAML format for a model (CLI-compatible)
 */
interface YamlModel {
  model: string;
  displayName?: string;
  passed?: number;
  total?: number;
  percent?: number;
  totalParams?: number;
  activeParams?: number;
  color?: string;
}

/**
 * YAML format for a custom provider (CLI-compatible)
 */
interface YamlCustomProvider {
  key: string;
  color: string;
  iconDataUrl?: string;
}

/**
 * YAML root format (CLI-compatible)
 */
interface YamlConfig {
  title: string;
  description?: string;
  sponsoredBy?: string;
  showRankings?: boolean;
  percentPrecision?: number;
  font?: string;
  models: YamlModel[];
  customProviders?: YamlCustomProvider[];
}

/**
 * Convert ChartConfig to CLI-compatible YAML string
 */
export function chartConfigToYaml(config: ChartConfig): string {
  const yamlConfig: YamlConfig = {
    title: config.title,
    models: [],
  };

  // Add optional top-level fields
  if (config.description?.trim()) {
    yamlConfig.description = config.description.trim();
  }
  if (config.sponsoredBy?.trim()) {
    yamlConfig.sponsoredBy = config.sponsoredBy.trim();
  }
  if (config.showRankings) {
    yamlConfig.showRankings = true;
  }
  if (config.percentPrecision !== 1) {
    yamlConfig.percentPrecision = config.percentPrecision;
  }
  if (config.font && config.font !== "sora") {
    yamlConfig.font = config.font;
  }

  // Convert models
  yamlConfig.models = config.models.map((m) => {
    const yamlModel: YamlModel = {
      model: m.provider,
    };

    // Add display name
    if (m.modelName.trim()) {
      yamlModel.displayName = m.modelName.trim();
    }

    // Parse score and add appropriate fields
    const parsed = parseScore(m.score);
    if (parsed) {
      if (parsed.mode === "fraction") {
        yamlModel.passed = parsed.passed;
        yamlModel.total = parsed.total;
      } else {
        yamlModel.percent = parsed.percent;
      }
    }

    // Add optional fields
    if (m.totalParams) {
      const params = parseInt(m.totalParams, 10);
      if (!isNaN(params)) yamlModel.totalParams = params;
    }
    if (m.activeParams) {
      const params = parseInt(m.activeParams, 10);
      if (!isNaN(params)) yamlModel.activeParams = params;
    }
    if (m.color) {
      yamlModel.color = m.color;
    }

    return yamlModel;
  });

  // Add custom providers if any
  if (config.customProviders.length > 0) {
    yamlConfig.customProviders = config.customProviders.map((cp) => {
      const yamlProvider: YamlCustomProvider = {
        key: cp.key,
        color: cp.color,
      };
      if (cp.iconDataUrl) {
        yamlProvider.iconDataUrl = cp.iconDataUrl;
      }
      return yamlProvider;
    });
  }

  return stringify(yamlConfig, {
    lineWidth: 0, // Don't wrap lines
    defaultStringType: "QUOTE_DOUBLE",
    defaultKeyType: "PLAIN",
  });
}

/**
 * Parse YAML string to ChartConfig
 * Throws an error with a descriptive message if parsing fails
 */
export function yamlToChartConfig(yamlString: string): ChartConfig {
  let parsed: unknown;
  
  try {
    parsed = parse(yamlString);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    throw new Error(`Invalid YAML syntax: ${message}`);
  }

  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("YAML must be an object");
  }

  const data = parsed as Record<string, unknown>;

  // Validate required fields
  if (typeof data.title !== "string" || !data.title.trim()) {
    throw new Error("Missing required field 'title'");
  }

  if (!Array.isArray(data.models) || data.models.length === 0) {
    throw new Error("Missing or empty 'models' array");
  }

  // Parse font
  let font: FontFamily = "sora";
  if (data.font !== undefined) {
    if (typeof data.font !== "string") {
      throw new Error("Field 'font' must be a string");
    }
    const normalizedFont = data.font.toLowerCase().replace(/\s+/g, "-");
    if (!validFonts.has(normalizedFont)) {
      throw new Error(`Invalid font '${data.font}'. Valid options: ${[...validFonts].join(", ")}`);
    }
    font = normalizedFont as FontFamily;
  }

  // Parse models
  const models: ModelConfig[] = data.models.map((m: unknown, index: number) => {
    if (typeof m !== "object" || m === null) {
      throw new Error(`Model at index ${index} must be an object`);
    }

    const model = m as Record<string, unknown>;

    // Validate model field
    if (typeof model.model !== "string" || !model.model.trim()) {
      throw new Error(`Model at index ${index}: missing required field 'model'`);
    }

    // Determine score and validate
    const hasPercent = model.percent !== undefined;
    const hasFraction = model.passed !== undefined || model.total !== undefined;

    if (!hasPercent && !hasFraction) {
      throw new Error(`Model at index ${index}: must have either 'percent' or 'passed'/'total'`);
    }

    let score = "";

    if (hasPercent) {
      const pct = Number(model.percent);
      if (isNaN(pct) || pct < 0 || pct > 100) {
        throw new Error(`Model at index ${index}: 'percent' must be a number between 0 and 100`);
      }
      score = `${pct}%`;
    } else {
      const p = Number(model.passed);
      const t = Number(model.total);
      if (isNaN(p) || p < 0) {
        throw new Error(`Model at index ${index}: 'passed' must be a non-negative number`);
      }
      if (isNaN(t) || t <= 0) {
        throw new Error(`Model at index ${index}: 'total' must be a positive number`);
      }
      if (p > t) {
        throw new Error(`Model at index ${index}: 'passed' cannot exceed 'total'`);
      }
      score = `${p}/${t}`;
    }

    // Parse optional fields
    let totalParams = "";
    if (model.totalParams !== undefined) {
      const params = Number(model.totalParams);
      if (isNaN(params) || params <= 0) {
        throw new Error(`Model at index ${index}: 'totalParams' must be a positive number`);
      }
      totalParams = String(params);
    }

    let activeParams = "";
    if (model.activeParams !== undefined) {
      const params = Number(model.activeParams);
      if (isNaN(params) || params <= 0) {
        throw new Error(`Model at index ${index}: 'activeParams' must be a positive number`);
      }
      activeParams = String(params);
    }

    let color = "";
    if (model.color !== undefined) {
      if (typeof model.color !== "string" || !/^#[0-9A-Fa-f]{6}$/.test(model.color)) {
        throw new Error(`Model at index ${index}: 'color' must be a valid hex color (e.g., #FF5733)`);
      }
      color = model.color;
    }

    // Extract provider from model field (handle "provider/model-name" format)
    const modelStr = String(model.model).trim();
    const provider = modelStr.includes("/") ? modelStr.split("/")[0] : modelStr;

    // Use displayName if provided, otherwise extract from model field
    let modelName = "";
    if (typeof model.displayName === "string" && model.displayName.trim()) {
      modelName = model.displayName.trim();
    } else if (modelStr.includes("/")) {
      modelName = modelStr.split("/").slice(1).join("/");
    }

    return {
      id: generateId(),
      provider,
      modelName,
      score,
      totalParams,
      activeParams,
      color,
      showAdvanced: false,
    };
  });

  // Parse custom providers
  const customProviders: CustomProvider[] = [];
  if (Array.isArray(data.customProviders)) {
    data.customProviders.forEach((cp: unknown, index: number) => {
      if (typeof cp !== "object" || cp === null) {
        throw new Error(`Custom provider at index ${index} must be an object`);
      }

      const provider = cp as Record<string, unknown>;

      if (typeof provider.key !== "string" || !provider.key.trim()) {
        throw new Error(`Custom provider at index ${index}: missing required field 'key'`);
      }

      if (typeof provider.color !== "string" || !/^#[0-9A-Fa-f]{6}$/.test(provider.color)) {
        throw new Error(`Custom provider at index ${index}: 'color' must be a valid hex color`);
      }

      customProviders.push({
        key: provider.key.trim(),
        name: provider.key.trim(), // Use key as name if no name field
        color: provider.color,
        iconDataUrl: typeof provider.iconDataUrl === "string" ? provider.iconDataUrl : undefined,
      });
    });
  }

  return {
    title: data.title.trim(),
    description: typeof data.description === "string" ? data.description.trim() : "",
    sponsoredBy: typeof data.sponsoredBy === "string" ? data.sponsoredBy.trim() : "",
    showRankings: data.showRankings === true,
    percentPrecision: typeof data.percentPrecision === "number" ? Math.min(3, Math.max(0, Math.floor(data.percentPrecision))) : 1,
    font,
    models,
    customProviders,
  };
}

/**
 * Save ChartConfig to localStorage
 */
export function saveConfigToStorage(config: ChartConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Silently fail if localStorage is unavailable or full
    console.warn("Failed to save config to localStorage");
  }
}

/**
 * Load ChartConfig from localStorage
 * Returns null if no saved config or if parsing fails
 */
export function loadConfigFromStorage(): ChartConfig | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;

    const parsed = JSON.parse(saved) as ChartConfig;
    
    // Basic validation to ensure it's a valid config
    if (
      typeof parsed.title !== "string" ||
      !Array.isArray(parsed.models) ||
      parsed.models.length === 0
    ) {
      return null;
    }

    // Ensure all models have required fields (migration safety)
    // Use 'any' for migration to handle old format
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parsed.models = parsed.models.map((m: any) => {
      // Handle migration from old format (scoreMode/passed/total/percent) to new format (score)
      let score = m.score ?? "";
      if (!score && m.scoreMode) {
        // Migrate from old format
        if (m.scoreMode === "percent" && m.percent) {
          score = `${m.percent}%`;
        } else if (m.passed !== undefined && m.total !== undefined) {
          score = `${m.passed}/${m.total}`;
        }
      }

      return {
        id: m.id || generateId(),
        provider: m.provider || "",
        modelName: m.modelName || "",
        score,
        totalParams: m.totalParams ?? "",
        activeParams: m.activeParams ?? "",
        color: m.color ?? "",
        showAdvanced: m.showAdvanced ?? false,
      };
    });

    // Ensure customProviders array exists
    parsed.customProviders = parsed.customProviders || [];

    return parsed;
  } catch {
    // Silently fail and return null
    console.warn("Failed to load config from localStorage");
    return null;
  }
}
