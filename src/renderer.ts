import { inline, install } from "@twind/core";
import presetAutoprefix from "@twind/preset-autoprefix";
import presetTailwind from "@twind/preset-tailwind";
import type { InputConfig, ProcessedModel } from "./types.js";

// Initialize Twind once
install({
  presets: [presetAutoprefix(), presetTailwind()],
});

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderHorizontalChart(models: ProcessedModel[]): string {
  return models
    .map(
      (m) => `
      <div class="flex items-center gap-4 py-2">
        <!-- Icon placeholder -->
        <div class="w-8 h-8 rounded-md flex items-center justify-center bg-gray-100 shrink-0">
          <span class="text-xs text-gray-400">${escapeHtml(m.provider.slice(0, 2).toUpperCase())}</span>
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
    .join("\n");
}

function renderVerticalChart(models: ProcessedModel[]): string {
  return `
    <div class="flex items-end justify-center gap-4 h-96">
      ${models
        .map(
          (m) => `
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
          
          <!-- Icon placeholder -->
          <div class="w-8 h-8 rounded-md flex items-center justify-center bg-gray-100 shrink-0">
            <span class="text-xs text-gray-400">${escapeHtml(m.provider.slice(0, 2).toUpperCase())}</span>
          </div>
          
          <!-- Model name (rotated) -->
          <div class="text-xs text-gray-600 text-center h-16 overflow-hidden" title="${escapeHtml(m.modelName)}">
            <span class="block truncate w-20">${escapeHtml(m.modelName.split("-")[0])}</span>
          </div>
        </div>`
        )
        .join("\n")}
    </div>`;
}

export function renderHtml(config: InputConfig, models: ProcessedModel[]): string {
  const isVertical = config.orientation === "vertical";
  const chartHtml = isVertical ? renderVerticalChart(models) : renderHorizontalChart(models);

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
