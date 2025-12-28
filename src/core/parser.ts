import { parse } from "yaml";
import type { InputConfig, ModelData, ProcessedModel } from "./types.js";
import { getProviderConfig } from "./providers.js";

export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ParseError";
  }
}

/**
 * Format params label based on totalParams and activeParams.
 * - If only totalParams: "123B Dense"
 * - If totalParams === activeParams: "123B Dense"
 * - If different: "355B / 32B Active"
 */
function formatParamsLabel(totalParams?: number, activeParams?: number): string | undefined {
  if (totalParams === undefined) return undefined;
  if (activeParams === undefined || totalParams === activeParams) {
    return `${totalParams}B Dense`;
  }
  return `${totalParams}B / ${activeParams}B Active`;
}

function validateModelData(model: unknown, index: number): ModelData {
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

  return {
    model: m.model,
    positive: m.positive as number | undefined,
    total: m.total as number | undefined,
    percent: m.percent as number | undefined,
    displayName: m.displayName as string | undefined,
    totalParams: m.totalParams as number | undefined,
    activeParams: m.activeParams as number | undefined,
    color: m.color as string | undefined,
  };
}

function validateInputConfig(data: unknown): InputConfig {
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

  // Validate optional percentPrecision
  if (d.percentPrecision !== undefined) {
    if (typeof d.percentPrecision !== "number" || !Number.isInteger(d.percentPrecision) || d.percentPrecision < 0) {
      throw new ParseError("percentPrecision must be a non-negative integer");
    }
  }

  if (!Array.isArray(d.models) || d.models.length === 0) {
    throw new ParseError("models must be a non-empty array");
  }

  const models = d.models.map((m, i) => validateModelData(m, i));

  return {
    title: d.title,
    subtitle: d.subtitle as string | undefined,
    sponsoredBy: d.sponsoredBy as string | undefined,
    showRankings: d.showRankings === true,
    percentPrecision: (d.percentPrecision as number | undefined) ?? 0,
    font: typeof d.font === "string" ? d.font : undefined,
    models,
  };
}

/**
 * Calculate ranks with tie handling.
 * Same percentage = same rank, then skip to position.
 * Example: [100, 80, 65, 65, 55, 55, 55, 45] → [1, 2, 3, 3, 5, 5, 5, 8]
 */
function calculateRanks(models: ProcessedModel[]): void {
  if (models.length === 0) return;

  models[0].rank = 1;
  for (let i = 1; i < models.length; i++) {
    if (models[i].percentage === models[i - 1].percentage) {
      // Same percentage = same rank as previous
      models[i].rank = models[i - 1].rank;
    } else {
      // Different percentage = position-based rank (1-indexed)
      models[i].rank = i + 1;
    }
  }
}

/**
 * Parse a YAML string into an InputConfig.
 * Throws ParseError if the YAML is invalid or doesn't match the expected schema.
 */
export function parseYaml(yamlString: string): InputConfig {
  let data: unknown;

  try {
    data = parse(yamlString);
  } catch (e) {
    throw new ParseError(`Invalid YAML: ${e instanceof Error ? e.message : String(e)}`);
  }

  return validateInputConfig(data);
}

/**
 * Process and sort models by percentage (best to worst).
 * Calculates ranks with tie handling.
 */
export function processModels(config: InputConfig): ProcessedModel[] {
  const models: ProcessedModel[] = config.models
    .map((m) => {
      const [provider, ...rest] = m.model.split("/");
      const modelName = rest.join("/"); // handle case of multiple slashes
      const usePercent = m.percent !== undefined;
      const percentage = usePercent ? m.percent! : (m.positive! / m.total!) * 100;
      return {
        ...m,
        provider,
        modelName,
        displayLabel: m.displayName ?? modelName,
        percentage,
        providerConfig: getProviderConfig(provider),
        rank: 0, // will be calculated after sorting
        paramsLabel: formatParamsLabel(m.totalParams, m.activeParams),
        usePercent,
      };
    })
    .sort((a, b) => b.percentage - a.percentage);

  // Calculate ranks with tie handling
  calculateRanks(models);

  return models;
}
