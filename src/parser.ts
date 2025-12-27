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

  if (typeof m.positive !== "number" || !Number.isInteger(m.positive) || m.positive < 0) {
    throw new ParseError(`models[${index}].positive must be a non-negative integer`);
  }

  if (typeof m.total !== "number" || !Number.isInteger(m.total) || m.total <= 0) {
    throw new ParseError(`models[${index}].total must be a positive integer`);
  }

  if (m.positive > m.total) {
    throw new ParseError(`models[${index}].positive (${m.positive}) cannot exceed total (${m.total})`);
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

  return {
    model: m.model,
    positive: m.positive,
    total: m.total,
    displayName: m.displayName as string | undefined,
    totalParams: m.totalParams as number | undefined,
    activeParams: m.activeParams as number | undefined,
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

  if (d.orientation !== undefined && d.orientation !== "horizontal" && d.orientation !== "vertical") {
    throw new ParseError('orientation must be "horizontal" or "vertical"');
  }

  if (!Array.isArray(d.models) || d.models.length === 0) {
    throw new ParseError("models must be a non-empty array");
  }

  const models = d.models.map((m, i) => validateModelData(m, i));

  return {
    title: d.title,
    subtitle: d.subtitle as string | undefined,
    sponsoredBy: d.sponsoredBy as string | undefined,
    orientation: (d.orientation as "horizontal" | "vertical") ?? "horizontal",
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
 * Parse and validate a YAML input file.
 * Returns processed models sorted by percentage (best to worst).
 */
export async function parseInputFile(filePath: string): Promise<{
  config: InputConfig;
  models: ProcessedModel[];
}> {
  const file = Bun.file(filePath);

  if (!(await file.exists())) {
    throw new ParseError(`Input file not found: ${filePath}`);
  }

  const content = await file.text();
  let data: unknown;

  try {
    data = parse(content);
  } catch (e) {
    throw new ParseError(`Invalid YAML: ${e instanceof Error ? e.message : String(e)}`);
  }

  const config = validateInputConfig(data);

  // Process and sort models by percentage (descending)
  const models: ProcessedModel[] = config.models
    .map((m) => {
      const [provider, ...rest] = m.model.split("/");
      const modelName = rest.join("/"); // handle case of multiple slashes
      return {
        ...m,
        provider,
        modelName,
        displayLabel: m.displayName ?? modelName,
        percentage: (m.positive / m.total) * 100,
        providerConfig: getProviderConfig(provider),
        rank: 0, // will be calculated after sorting
        paramsLabel: formatParamsLabel(m.totalParams, m.activeParams),
      };
    })
    .sort((a, b) => b.percentage - a.percentage);

  // Calculate ranks with tie handling
  calculateRanks(models);

  return { config, models };
}
