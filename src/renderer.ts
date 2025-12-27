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
      <div class="flex items-center gap-4 py-2">
        <!-- Icon -->
        <div class="w-8 h-8 rounded-md flex items-center justify-center bg-gray-100 shrink-0 overflow-hidden">
          ${await loadIcon(m.providerConfig.iconPath, m.provider)}
        </div>
        
        <!-- Model name -->
        <div class="w-48 shrink-0 truncate text-sm font-medium text-gray-700" title="${escapeHtml(m.modelName)}">
          ${escapeHtml(m.modelName)}
        </div>
        
        <!-- Bar container -->
        <div class="flex-1 h-8 bg-gray-100 rounded-md overflow-hidden">
          <div 
            class="h-full rounded-md flex items-center justify-end pr-2"
            style="width: ${m.percentage.toFixed(1)}%; background-color: ${m.providerConfig.color};"
          >
            <span class="text-xs font-semibold text-white drop-shadow-sm">
              ${m.positive}/${m.total}
            </span>
          </div>
        </div>
        
        <!-- Percentage -->
        <div class="w-16 text-right text-sm font-semibold text-gray-700">
          ${m.percentage.toFixed(1)}%
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
          <!-- Bar -->
          <div class="w-full bg-gray-100 rounded-t-md flex flex-col justify-end" style="height: 320px;">
            <div 
              class="w-full rounded-t-md flex items-start justify-center pt-2"
              style="height: ${m.percentage.toFixed(1)}%; background-color: ${m.providerConfig.color};"
            >
              <span class="text-xs font-semibold text-white drop-shadow-sm">
                ${m.percentage.toFixed(0)}%
              </span>
            </div>
          </div>
          
          <!-- Icon -->
          <div class="w-8 h-8 rounded-md flex items-center justify-center bg-gray-100 shrink-0 overflow-hidden">
            ${await loadIcon(m.providerConfig.iconPath, m.provider)}
          </div>
          
          <!-- Model name (rotated) -->
          <div class="text-xs text-gray-600 text-center h-16 overflow-hidden" title="${escapeHtml(m.modelName)}">
            <span class="block truncate w-20">${escapeHtml(m.modelName.split("-")[0])}</span>
          </div>
        </div>`
    )
  );
  return `
    <div class="flex items-end justify-center gap-4 h-96">
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
<body class="min-h-screen bg-white p-8">
  <div class="max-w-4xl mx-auto">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">${escapeHtml(config.title)}</h1>
      ${config.subtitle ? `<p class="text-gray-500 mt-1">${escapeHtml(config.subtitle)}</p>` : ""}
    </div>
    
    <!-- Chart -->
    <div class="${isVertical ? "py-8" : "space-y-1"}">
      ${chartHtml}
    </div>
    
    <!-- Footer -->
    ${
      config.sponsoredBy
        ? `
    <div class="mt-8 pt-4 border-t border-gray-200">
      <p class="text-sm text-gray-400 text-right">Sponsored by ${escapeHtml(config.sponsoredBy)}</p>
    </div>`
        : ""
    }
  </div>
</body>
</html>`;

  // Process with Twind - extracts used classes and injects <style> into <head>
  return inline(rawHtml);
}
