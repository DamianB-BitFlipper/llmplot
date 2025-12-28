import type { InputConfig, ProcessedModel } from "./types.js";
import { getProviderConfig } from "./providers.js";

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
 */
export function processModels(config: InputConfig): ProcessedModel[] {
  const models: ProcessedModel[] = config.models
    .map((m) => {
      const [provider, ...rest] = m.model.split("/");
      const modelName = rest.join("/"); // handle case of multiple slashes
      const usePercent = m.percent !== undefined;
      const percentage = usePercent ? m.percent! : (m.positive! / m.total!) * 100;
      
      // Get default provider config
      const defaultConfig = getProviderConfig(provider);
      
      return {
        ...m,
        provider,
        modelName,
        displayLabel: m.displayName ?? modelName,
        percentage,
        // Use model's custom color/icon if provided, otherwise use provider defaults
        providerConfig: {
          color: m.color ?? defaultConfig.color,
          iconUrl: m.icon ?? defaultConfig.iconUrl,
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
