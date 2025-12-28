import type { InputConfig, ProcessedModel, CustomProvider } from "./types.js";
import { getProviderConfig } from "./providers.js";

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Regex pattern for valid icon data URLs.
 * Matches: data:image/svg+xml;base64,... or data:image/png;base64,...
 */
const ICON_DATA_URL_PATTERN = /^data:image\/(svg\+xml|png);base64,[A-Za-z0-9+/]+=*$/;

/**
 * Validate that an icon is a valid base64 data URL.
 * Throws ValidationError if the icon is not a valid data URL.
 * 
 * @param icon - The icon string to validate
 * @param context - Context for error messages (e.g., "models[0].icon")
 */
function validateIconDataUrl(icon: string, context: string): void {
  if (!ICON_DATA_URL_PATTERN.test(icon)) {
    throw new ValidationError(
      `${context} must be a base64 data URL (data:image/svg+xml;base64,... or data:image/png;base64,...)`
    );
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
 * Process and sort models by percentage (best to worst).
 * Calculates ranks with tie handling.
 * Custom providers override built-in providers when matching by key.
 */
export function processModels(config: InputConfig): ProcessedModel[] {
  // Validate that there is at least one model
  if (!config.models || config.models.length === 0) {
    throw new ValidationError("models must be a non-empty array");
  }

  // Build a lookup map for custom providers
  const customProviderMap = new Map<string, CustomProvider>();
  if (config.customProviders) {
    for (const cp of config.customProviders) {
      // Validate custom provider icon if present
      if (cp.iconDataUrl !== undefined) {
        validateIconDataUrl(cp.iconDataUrl, `customProviders[${cp.key}].iconDataUrl`);
      }
      customProviderMap.set(cp.key.toLowerCase(), cp);
    }
  }

  const models: ProcessedModel[] = config.models
    .map((m, index) => {
      const parts = m.model.split("/");
      const provider = parts[0];
      const modelName = parts.length > 1 ? parts.slice(1).join("/") : undefined; // handle case of multiple slashes or no slash
      const usePercent = m.percent !== undefined;
      const percentage = usePercent ? m.percent! : (m.passed! / m.total!) * 100;
      
      // Validate custom icon is a valid data URL
      if (m.iconDataUrl !== undefined) {
        validateIconDataUrl(m.iconDataUrl, `models[${index}].iconDataUrl`);
      }
      
      // Check for custom provider first (case-insensitive), then fall back to built-in
      const customProvider = customProviderMap.get(provider.toLowerCase());
      const defaultConfig = getProviderConfig(provider);
      
      // Priority: model override > custom provider > built-in provider
      const resolvedColor = m.color ?? customProvider?.color ?? defaultConfig.color;
      const resolvedIconUrl = m.iconDataUrl ?? customProvider?.iconDataUrl ?? defaultConfig.iconUrl;
      
      return {
        ...m,
        provider,
        modelName,
        displayLabel: m.displayName ?? modelName ?? provider,
        percentage,
        providerConfig: {
          color: resolvedColor,
          iconUrl: resolvedIconUrl,
        },
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
