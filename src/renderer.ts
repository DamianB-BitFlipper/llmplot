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

async function renderHorizontalChart(models: ProcessedModel[], showRankings: boolean): Promise<string> {
  const rows = await Promise.all(
    models.map(
      async (m) => `
      <div class="flex items-center gap-4 py-4">
        ${showRankings ? `
        <!-- Rank badge -->
        <div 
          class="w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
          style="background-color: ${getRankBadge(m.rank).bg}; color: ${getRankBadge(m.rank).text};"
        >
          ${m.rank}
        </div>
        ` : ""}
        <!-- Icon -->
        <div class="w-12 h-12 shrink-0 flex items-center justify-center">
          ${await loadIcon(m.providerConfig.iconPath, m.provider)}
        </div>
        
        <!-- Name + Bar stacked -->
        <div class="flex-1 min-w-0">
          <!-- Name row with percentage -->
          <div class="flex items-baseline justify-between mb-1">
            <div class="flex items-baseline gap-2">
              <span class="text-lg text-gray-800">${escapeHtml(m.displayLabel)}</span>
              ${m.paramsLabel ? `<span class="text-gray-400 text-sm">${escapeHtml(m.paramsLabel)}</span>` : ""}
            </div>
            <span class="font-semibold text-lg text-gray-800">${Math.round(m.percentage)}%</span>
          </div>
          
          <!-- Bar container (full width) -->
          <div class="h-7 bg-gray-200 rounded-full overflow-hidden">
            <div 
              class="h-full rounded-full flex items-center justify-end pr-3"
              style="width: ${m.percentage.toFixed(1)}%; background-color: ${m.providerConfig.color};"
            >
              <span class="text-xs font-medium text-white drop-shadow-sm">
                ${m.positive}/${m.total}
              </span>
            </div>
          </div>
        </div>
      </div>`
    )
  );
  return rows.join("\n");
}

async function renderVerticalChart(models: ProcessedModel[], showRankings: boolean): Promise<string> {
  const columns = await Promise.all(
    models.map(
      async (m) => `
        <div class="flex flex-col items-center gap-2 w-20">
          <!-- Bar -->
          <div class="w-full bg-gray-200 rounded-full flex flex-col justify-end" style="height: 280px;">
            <div 
              class="w-full rounded-full flex items-start justify-center pt-2"
              style="height: ${m.percentage.toFixed(1)}%; background-color: ${m.providerConfig.color};"
            >
              <span class="text-xs font-semibold text-white drop-shadow-sm">
                ${Math.round(m.percentage)}%
              </span>
            </div>
          </div>
          
          ${showRankings ? `
          <!-- Rank badge -->
          <div 
            class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
            style="background-color: ${getRankBadge(m.rank).bg}; color: ${getRankBadge(m.rank).text};"
          >
            ${m.rank}
          </div>
          ` : ""}
          
          <!-- Icon -->
          <div class="w-10 h-10 flex items-center justify-center shrink-0">
            ${await loadIcon(m.providerConfig.iconPath, m.provider)}
          </div>
          
          <!-- Model name -->
          <div class="text-xs text-gray-600 text-center h-12 overflow-hidden" title="${escapeHtml(m.displayLabel)}">
            <span class="block truncate w-20">${escapeHtml(m.displayLabel)}</span>
          </div>
        </div>`
    )
  );
  return `
    <div class="flex items-end justify-center gap-4">
      ${columns.join("\n")}
    </div>`;
}

function getRankBadge(rank: number): { bg: string; text: string } {
  if (rank === 1) return { bg: "#F59E0B", text: "white" }; // gold
  if (rank === 2) return { bg: "#9CA3AF", text: "white" }; // silver
  if (rank === 3) return { bg: "#CD7F32", text: "white" }; // bronze
  return { bg: "#E6E7EB", text: "#6B7280" }; // light gray with dark text for 4+
}

export async function renderHtml(config: InputConfig, models: ProcessedModel[]): Promise<string> {
  const isVertical = config.orientation === "vertical";
  const showRankings = config.showRankings ?? false;
  const fontFamily = config.font 
    ? `'${config.font}', ui-sans-serif, system-ui, sans-serif`
    : `ui-sans-serif, system-ui, sans-serif`;
  const chartHtml = isVertical 
    ? await renderVerticalChart(models, showRankings) 
    : await renderHorizontalChart(models, showRankings);

  const rawHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(config.title)}</title>
</head>
<body class="min-h-screen bg-gray-100 p-8" style="font-family: ${fontFamily};">
  <div class="max-w-4xl mx-auto bg-white rounded-xl p-8 shadow-sm">
    <!-- Header -->
    <div class="mb-4">
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
