import { parse } from "yaml";
import type { InputConfig, ModelData, ProcessedModel } from "./types.js";
import { getProviderConfig } from "./providers.js";

export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ParseError";
  }
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

  return {
    model: m.model,
    positive: m.positive,
    total: m.total,
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
        percentage: (m.positive / m.total) * 100,
        providerConfig: getProviderConfig(provider),
      };
    })
    .sort((a, b) => b.percentage - a.percentage);

  return { config, models };
}
