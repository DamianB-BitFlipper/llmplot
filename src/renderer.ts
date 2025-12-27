import { inline, install } from "@twind/core";
import presetAutoprefix from "@twind/preset-autoprefix";
import presetTailwind from "@twind/preset-tailwind";
import type { InputConfig, ProcessedModel } from "./types.js";

// Initialize Twind once
install({
  presets: [presetAutoprefix(), presetTailwind()],
});

// Cache for loaded SVG icons
const iconCache = new Map<string, string>();

/**
 * Get rank badge background color.
 * Gold for 1st, silver for 2nd, bronze for 3rd, gray for rest.
 */
function getRankBadgeColor(rank: number): string {
  if (rank === 1) return "#F59E0B"; // gold/amber
  if (rank === 2) return "#9CA3AF"; // silver/gray
  if (rank === 3) return "#CD7F32"; // bronze
  return "#6B7280"; // gray for 4+
}

/**
 * Load an SVG icon from disk and cache it.
 * Returns the SVG content or a placeholder if not found.
 */
async function loadIcon(iconPath: string | undefined, provider: string): Promise<string> {
  if (!iconPath) {
    return getPlaceholder(provider);
  }

  // Check cache first
  if (iconCache.has(iconPath)) {
    return iconCache.get(iconPath)!;
  }

  // Resolve path relative to project root (where the CLI is run from)
  const fullPath = new URL(`../${iconPath}`, import.meta.url).pathname;
  const file = Bun.file(fullPath);

  if (!(await file.exists())) {
    return getPlaceholder(provider);
  }

  try {
    const content = await file.text();
    
    // Make SVG responsive by ensuring it has width/height or viewBox
    const processedSvg = content
      .replace(/<svg/, '<svg class="w-full h-full"')
      .replace(/width="[^"]*"/, "")
      .replace(/height="[^"]*"/, "");
    
    iconCache.set(iconPath, processedSvg);
    return processedSvg;
  } catch {
    return getPlaceholder(provider);
  }
}

function getPlaceholder(provider: string): string {
  return `<span class="text-xs text-gray-400">${escapeHtml(provider.slice(0, 2).toUpperCase())}</span>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function renderHorizontalChart(models: ProcessedModel[]): Promise<string> {
  const rows = await Promise.all(
    models.map(
      async (m) => `
      <div class="flex items-start gap-4 py-4">
        <!-- Rank badge -->
        <div 
          class="w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0 mt-1"
          style="background-color: ${getRankBadgeColor(m.rank)};"
        >
          ${m.rank}
        </div>
        
        <!-- Icon -->
        <div class="w-12 h-12 shrink-0 flex items-center justify-center">
          ${await loadIcon(m.providerConfig.iconPath, m.provider)}
        </div>
        
        <!-- Name + Bar stacked -->
        <div class="flex-1 min-w-0">
          <!-- Name row -->
          <div class="flex items-baseline gap-2 mb-1">
            <span class="font-semibold text-lg text-gray-800">${escapeHtml(m.modelName)}</span>
            ${m.paramsLabel ? `<span class="text-gray-400 text-sm">${escapeHtml(m.paramsLabel)}</span>` : ""}
          </div>
          
          <!-- Bar container -->
          <div class="h-6 bg-gray-100 rounded-md overflow-hidden">
            <div 
              class="h-full rounded-r-md flex items-center justify-end pr-2"
              style="width: ${m.percentage.toFixed(1)}%; background-color: ${m.providerConfig.color};"
            >
              <span class="text-xs font-medium text-white drop-shadow-sm">
                ${m.positive}/${m.total}
              </span>
            </div>
          </div>
        </div>
        
        <!-- Percentage (no decimal) -->
        <div class="w-14 text-right font-semibold text-lg text-gray-800 shrink-0">
          ${Math.round(m.percentage)}%
        </div>
      </div>`
    )
  );
  return rows.join("\n");
}

async function renderVerticalChart(models: ProcessedModel[]): Promise<string> {
  const columns = await Promise.all(
    models.map(
      async (m) => `
        <div class="flex flex-col items-center gap-2 w-20">
          <!-- Rank badge -->
          <div 
            class="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
            style="background-color: ${getRankBadgeColor(m.rank)};"
          >
            ${m.rank}
          </div>
          
          <!-- Bar -->
          <div class="w-full bg-gray-100 rounded-t-md flex flex-col justify-end" style="height: 280px;">
            <div 
              class="w-full rounded-t-md flex items-start justify-center pt-2"
              style="height: ${m.percentage.toFixed(1)}%; background-color: ${m.providerConfig.color};"
            >
              <span class="text-xs font-semibold text-white drop-shadow-sm">
                ${Math.round(m.percentage)}%
              </span>
            </div>
          </div>
          
          <!-- Icon -->
          <div class="w-10 h-10 flex items-center justify-center shrink-0">
            ${await loadIcon(m.providerConfig.iconPath, m.provider)}
          </div>
          
          <!-- Model name -->
          <div class="text-xs text-gray-600 text-center h-12 overflow-hidden" title="${escapeHtml(m.modelName)}">
            <span class="block truncate w-20">${escapeHtml(m.modelName.split("-")[0])}</span>
          </div>
        </div>`
    )
  );
  return `
    <div class="flex items-end justify-center gap-4">
      ${columns.join("\n")}
    </div>`;
}

export async function renderHtml(config: InputConfig, models: ProcessedModel[]): Promise<string> {
  const isVertical = config.orientation === "vertical";
  const chartHtml = isVertical ? await renderVerticalChart(models) : await renderHorizontalChart(models);

  const rawHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(config.title)}</title>
</head>
<body class="min-h-screen bg-gray-100 p-8">
  <div class="max-w-4xl mx-auto bg-white rounded-xl p-8 shadow-sm">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">${escapeHtml(config.title)}</h1>
      ${config.subtitle ? `<p class="text-gray-500 mt-1">${escapeHtml(config.subtitle)}</p>` : ""}
    </div>
    
    <!-- Chart -->
    <div class="${isVertical ? "py-8" : ""}">
      ${chartHtml}
    </div>
    
    <!-- Footer -->
    ${
      config.sponsoredBy
        ? `
    <div class="mt-8 pt-4 border-t border-gray-200">
      <p class="text-sm text-gray-400 text-right">Sponsored by <span class="font-semibold text-gray-600">${escapeHtml(config.sponsoredBy)}</span></p>
    </div>`
        : ""
    }
  </div>
</body>
</html>`;

  // Process with Twind - extracts used classes and injects <style> into <head>
  return inline(rawHtml);
}
