import { parse } from "yaml";
import { resolve, extname } from "path";
import type { InputConfig, ModelData, CustomProvider } from "../core/types.js";
import { fontFamilies, type FontFamily } from "../core/assets.js";

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
    const svg = await file.text();
    const base64 = Buffer.from(svg).toString("base64");
    return `data:image/svg+xml;base64,${base64}`;
  } else if (ext === ".png") {
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    return `data:image/png;base64,${base64}`;
  } else {
    throw new ParseError(`models[${index}].icon: unsupported format "${ext}" (use .svg or .png)`);
  }
}

/**
 * Raw custom provider from YAML before icon resolution.
 */
interface RawCustomProvider {
  key: string;
  color: string;
  iconPath?: string; // file path before resolution to iconDataUrl
}

/**
 * Regex for valid provider keys: lowercase alphanumeric with hyphens.
 * Examples: "my-company", "acme", "foo-bar-123"
 */
const PROVIDER_KEY_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * Regex for valid hex colors.
 */
const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

/**
 * Read a custom provider icon file and return it as a base64 data URL.
 */
async function readProviderIconFile(iconPath: string, basePath: string, index: number): Promise<string> {
  const fullPath = resolve(basePath, iconPath);
  const file = Bun.file(fullPath);

  if (!await file.exists()) {
    throw new ParseError(`customProviders[${index}].icon: file not found: ${fullPath}`);
  }

  const ext = extname(iconPath).toLowerCase();
  if (ext === ".svg") {
    const svg = await file.text();
    const base64 = Buffer.from(svg).toString("base64");
    return `data:image/svg+xml;base64,${base64}`;
  } else if (ext === ".png") {
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    return `data:image/png;base64,${base64}`;
  } else {
    throw new ParseError(`customProviders[${index}].icon: unsupported format "${ext}" (use .svg or .png)`);
  }
}

/**
 * Validate a single custom provider entry.
 */
function validateCustomProvider(provider: unknown, index: number): RawCustomProvider {
  if (typeof provider !== "object" || provider === null) {
    throw new ParseError(`customProviders[${index}] must be an object`);
  }

  const p = provider as Record<string, unknown>;

  // Validate key (required)
  if (typeof p.key !== "string" || !PROVIDER_KEY_PATTERN.test(p.key)) {
    throw new ParseError(
      `customProviders[${index}].key must be a lowercase string with alphanumeric characters and hyphens (e.g., "my-provider")`
    );
  }

  // Validate color (required)
  if (typeof p.color !== "string" || !HEX_COLOR_PATTERN.test(p.color)) {
    throw new ParseError(
      `customProviders[${index}].color must be a valid hex color (e.g., "#FF5733")`
    );
  }

  // Validate optional icon (file path)
  if (p.icon !== undefined && typeof p.icon !== "string") {
    throw new ParseError(`customProviders[${index}].icon must be a string (file path)`);
  }

  return {
    key: p.key,
    color: p.color,
    iconPath: p.icon as string | undefined,
  };
}

interface RawModelData {
  model: string;
  passed?: number;
  total?: number;
  percent?: number;
  displayName?: string;
  totalParams?: number;
  activeParams?: number;
  color?: string;
  iconPath?: string; // file path before resolution to iconDataUrl
}

function validateModelData(model: unknown, index: number): RawModelData {
  if (typeof model !== "object" || model === null) {
    throw new ParseError(`models[${index}] must be an object`);
  }

  const m = model as Record<string, unknown>;

  // Provider-only format (e.g., "anthropic") and provider/model-name format are both valid
  if (typeof m.model !== "string" || m.model.trim() === "") {
    throw new ParseError(`models[${index}].model must be a non-empty string`);
  }

  // Check for percent vs passed/total
  const hasPercent = m.percent !== undefined;
  const hasPassedTotal = m.passed !== undefined || m.total !== undefined;

  if (hasPercent && hasPassedTotal) {
    throw new ParseError(`models[${index}] cannot have both 'percent' and 'passed/total' - use one or the other`);
  }

  if (!hasPercent && !hasPassedTotal) {
    throw new ParseError(`models[${index}] must have either 'percent' or both 'passed' and 'total'`);
  }

  if (hasPercent) {
    if (typeof m.percent !== "number" || m.percent < 0 || m.percent > 100) {
      throw new ParseError(`models[${index}].percent must be a number between 0 and 100`);
    }
  } else {
    if (typeof m.passed !== "number" || !Number.isInteger(m.passed) || m.passed < 0) {
      throw new ParseError(`models[${index}].passed must be a non-negative integer`);
    }

    if (typeof m.total !== "number" || !Number.isInteger(m.total) || m.total <= 0) {
      throw new ParseError(`models[${index}].total must be a positive integer`);
    }

    if (m.passed > m.total) {
      throw new ParseError(`models[${index}].passed (${m.passed}) cannot exceed total (${m.total})`);
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

  // Validate optional icon (file path to be resolved later)
  if (m.icon !== undefined && typeof m.icon !== "string") {
    throw new ParseError(`models[${index}].icon must be a string (file path)`);
  }

  return {
    model: m.model,
    passed: m.passed as number | undefined,
    total: m.total as number | undefined,
    percent: m.percent as number | undefined,
    displayName: m.displayName as string | undefined,
    totalParams: m.totalParams as number | undefined,
    activeParams: m.activeParams as number | undefined,
    color: m.color as string | undefined,
    iconPath: m.icon as string | undefined,
  };
}

interface RawInputConfig {
  title: string;
  description?: string;
  sponsoredBy?: string;
  showRankings: boolean;
  percentPrecision: number;
  font?: FontFamily;
  customProviders: RawCustomProvider[];
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

  if (d.description !== undefined && typeof d.description !== "string") {
    throw new ParseError("description must be a string");
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

  // Validate and normalize optional font
  let normalizedFont: FontFamily | undefined;
  if (d.font !== undefined) {
    if (typeof d.font !== "string") {
      throw new ParseError("font must be a string");
    }
    // Normalize: lowercase and handle common variations
    const fontLower = d.font.toLowerCase().replace(/\s+/g, "-");
    // Map common variations to canonical names
    const fontMap: Record<string, FontFamily> = {
      "geist": "geist",
      "inter": "inter",
      "ibm-plex-sans": "ibm-plex-sans",
      "ibmplexsans": "ibm-plex-sans",
      "plex-sans": "ibm-plex-sans",
      "plexsans": "ibm-plex-sans",
      "manrope": "manrope",
      "sora": "sora",
      "space-grotesk": "space-grotesk",
      "spacegrotesk": "space-grotesk",
    };
    normalizedFont = fontMap[fontLower];
    if (!normalizedFont) {
      throw new ParseError(`font must be one of: ${fontFamilies.join(", ")}`);
    }
  }

  if (!Array.isArray(d.models) || d.models.length === 0) {
    throw new ParseError("models must be a non-empty array");
  }

  const models = d.models.map((m, i) => validateModelData(m, i));

  // Validate optional customProviders array
  let customProviders: RawCustomProvider[] = [];
  if (d.customProviders !== undefined) {
    if (!Array.isArray(d.customProviders)) {
      throw new ParseError("customProviders must be an array");
    }
    customProviders = d.customProviders.map((p, i) => validateCustomProvider(p, i));
  }

  return {
    title: d.title,
    description: d.description as string | undefined,
    sponsoredBy: d.sponsoredBy as string | undefined,
    showRankings: (d.showRankings as boolean | undefined) ?? false,
    percentPrecision: (d.percentPrecision as number | undefined) ?? 1,
    font: normalizedFont,
    customProviders,
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
      let iconDataUrl: string | undefined;
      if (m.iconPath) {
        iconDataUrl = await readIconFile(m.iconPath, resolvedBasePath, index);
      }

      return {
        model: m.model,
        passed: m.passed,
        total: m.total,
        percent: m.percent,
        displayName: m.displayName,
        totalParams: m.totalParams,
        activeParams: m.activeParams,
        color: m.color,
        iconDataUrl,
      };
    })
  );

  // Resolve custom provider icon file paths
  const customProviders: CustomProvider[] = await Promise.all(
    rawConfig.customProviders.map(async (p, index) => {
      let iconDataUrl: string | undefined;
      if (p.iconPath) {
        iconDataUrl = await readProviderIconFile(p.iconPath, resolvedBasePath, index);
      }

      return {
        key: p.key,
        color: p.color,
        iconDataUrl,
      };
    })
  );

  return {
    title: rawConfig.title,
    description: rawConfig.description,
    sponsoredBy: rawConfig.sponsoredBy,
    showRankings: rawConfig.showRankings,
    percentPrecision: rawConfig.percentPrecision,
    font: rawConfig.font,
    customProviders: customProviders.length > 0 ? customProviders : undefined,
    models,
  };
}
