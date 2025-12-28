import { parse } from "yaml";
import { resolve, extname } from "path";
import type { InputConfig, ModelData } from "../core/types.js";

export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ParseError";
  }
}

/**
 * Read an icon file and return it as an inline string.
 * SVG files are returned as-is, PNG files are converted to base64 data URLs.
 */
async function readIconFile(iconPath: string, basePath: string, index: number): Promise<string> {
  const fullPath = resolve(basePath, iconPath);
  const file = Bun.file(fullPath);

  if (!await file.exists()) {
    throw new ParseError(`models[${index}].icon: file not found: ${fullPath}`);
  }

  const ext = extname(iconPath).toLowerCase();
  if (ext === ".svg") {
    return await file.text();
  } else if (ext === ".png") {
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    return `data:image/png;base64,${base64}`;
  } else {
    throw new ParseError(`models[${index}].icon: unsupported format "${ext}" (use .svg or .png)`);
  }
}

interface RawModelData {
  model: string;
  positive?: number;
  total?: number;
  percent?: number;
  displayName?: string;
  totalParams?: number;
  activeParams?: number;
  color?: string;
  icon?: string; // file path before resolution
}

function validateModelData(model: unknown, index: number): RawModelData {
  if (typeof model !== "object" || model === null) {
    throw new ParseError(`models[${index}] must be an object`);
  }

  const m = model as Record<string, unknown>;

  if (typeof m.model !== "string" || m.model.trim() === "") {
    throw new ParseError(`models[${index}].model must be a non-empty string`);
  }

  if (!m.model.includes("/")) {
    throw new ParseError(`models[${index}].model must be in format "provider/model-name" (e.g., "anthropic/claude-opus-4.5")`);
  }

  // Check for percent vs positive/total
  const hasPercent = m.percent !== undefined;
  const hasPositiveTotal = m.positive !== undefined || m.total !== undefined;

  if (hasPercent && hasPositiveTotal) {
    throw new ParseError(`models[${index}] cannot have both 'percent' and 'positive/total' - use one or the other`);
  }

  if (!hasPercent && !hasPositiveTotal) {
    throw new ParseError(`models[${index}] must have either 'percent' or both 'positive' and 'total'`);
  }

  if (hasPercent) {
    if (typeof m.percent !== "number" || m.percent < 0 || m.percent > 100) {
      throw new ParseError(`models[${index}].percent must be a number between 0 and 100`);
    }
  } else {
    if (typeof m.positive !== "number" || !Number.isInteger(m.positive) || m.positive < 0) {
      throw new ParseError(`models[${index}].positive must be a non-negative integer`);
    }

    if (typeof m.total !== "number" || !Number.isInteger(m.total) || m.total <= 0) {
      throw new ParseError(`models[${index}].total must be a positive integer`);
    }

    if (m.positive > m.total) {
      throw new ParseError(`models[${index}].positive (${m.positive}) cannot exceed total (${m.total})`);
    }
  }

  // Validate optional displayName
  if (m.displayName !== undefined && typeof m.displayName !== "string") {
    throw new ParseError(`models[${index}].displayName must be a string`);
  }

  // Validate optional totalParams
  if (m.totalParams !== undefined) {
    if (typeof m.totalParams !== "number" || !Number.isInteger(m.totalParams) || m.totalParams <= 0) {
      throw new ParseError(`models[${index}].totalParams must be a positive integer (billions)`);
    }
  }

  // Validate optional activeParams
  if (m.activeParams !== undefined) {
    if (typeof m.activeParams !== "number" || !Number.isInteger(m.activeParams) || m.activeParams <= 0) {
      throw new ParseError(`models[${index}].activeParams must be a positive integer (billions)`);
    }
  }

  // Validate optional color (hex string)
  if (m.color !== undefined) {
    if (typeof m.color !== "string" || !/^#[0-9A-Fa-f]{6}$/.test(m.color)) {
      throw new ParseError(`models[${index}].color must be a valid hex color (e.g., "#FF5733")`);
    }
  }

  // Validate optional icon (file path)
  if (m.icon !== undefined) {
    if (typeof m.icon !== "string" || m.icon.trim() === "") {
      throw new ParseError(`models[${index}].icon must be a non-empty string (file path)`);
    }
  }

  return {
    model: m.model,
    positive: m.positive as number | undefined,
    total: m.total as number | undefined,
    percent: m.percent as number | undefined,
    displayName: m.displayName as string | undefined,
    totalParams: m.totalParams as number | undefined,
    activeParams: m.activeParams as number | undefined,
    color: m.color as string | undefined,
    icon: m.icon as string | undefined,
  };
}

interface RawInputConfig {
  title: string;
  subtitle?: string;
  sponsoredBy?: string;
  showRankings: boolean;
  percentPrecision: number;
  font?: string;
  models: RawModelData[];
}

function validateInputConfig(data: unknown): RawInputConfig {
  if (typeof data !== "object" || data === null) {
    throw new ParseError("Input file must contain a YAML object");
  }

  const d = data as Record<string, unknown>;

  if (typeof d.title !== "string" || d.title.trim() === "") {
    throw new ParseError("title is required and must be a non-empty string");
  }

  if (d.subtitle !== undefined && typeof d.subtitle !== "string") {
    throw new ParseError("subtitle must be a string");
  }

  if (d.sponsoredBy !== undefined && typeof d.sponsoredBy !== "string") {
    throw new ParseError("sponsoredBy must be a string");
  }

  // Validate optional showRankings
  if (d.showRankings !== undefined && typeof d.showRankings !== "boolean") {
    throw new ParseError("showRankings must be a boolean");
  }

  // Validate optional percentPrecision
  if (d.percentPrecision !== undefined) {
    if (typeof d.percentPrecision !== "number" || !Number.isInteger(d.percentPrecision) || d.percentPrecision < 0) {
      throw new ParseError("percentPrecision must be a non-negative integer");
    }
  }

  // Validate optional font
  if (d.font !== undefined && typeof d.font !== "string") {
    throw new ParseError("font must be a string");
  }

  if (!Array.isArray(d.models) || d.models.length === 0) {
    throw new ParseError("models must be a non-empty array");
  }

  const models = d.models.map((m, i) => validateModelData(m, i));

  return {
    title: d.title,
    subtitle: d.subtitle as string | undefined,
    sponsoredBy: d.sponsoredBy as string | undefined,
    showRankings: (d.showRankings as boolean | undefined) ?? false,
    percentPrecision: (d.percentPrecision as number | undefined) ?? 0,
    font: d.font as string | undefined,
    models,
  };
}

/**
 * Parse a YAML string into an InputConfig.
 * Throws ParseError if the YAML is invalid or doesn't match the expected schema.
 * 
 * @param yamlString - The YAML content to parse
 * @param basePath - Base directory for resolving relative icon paths (defaults to cwd)
 */
export async function parseYaml(yamlString: string, basePath?: string): Promise<InputConfig> {
  let data: unknown;

  try {
    data = parse(yamlString);
  } catch (e) {
    throw new ParseError(`Invalid YAML: ${e instanceof Error ? e.message : String(e)}`);
  }

  const rawConfig = validateInputConfig(data);
  const resolvedBasePath = basePath ?? process.cwd();

  // Resolve icon file paths to inline strings
  const models: ModelData[] = await Promise.all(
    rawConfig.models.map(async (m, index) => {
      let icon: string | undefined;
      if (m.icon) {
        icon = await readIconFile(m.icon, resolvedBasePath, index);
      }

      return {
        model: m.model,
        positive: m.positive,
        total: m.total,
        percent: m.percent,
        displayName: m.displayName,
        totalParams: m.totalParams,
        activeParams: m.activeParams,
        color: m.color,
        icon,
      };
    })
  );

  return {
    title: rawConfig.title,
    subtitle: rawConfig.subtitle,
    sponsoredBy: rawConfig.sponsoredBy,
    showRankings: rawConfig.showRankings,
    percentPrecision: rawConfig.percentPrecision,
    font: rawConfig.font,
    models,
  };
}
