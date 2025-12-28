import { inline, install } from "@twind/core";
import presetAutoprefix from "@twind/preset-autoprefix";
import presetTailwind from "@twind/preset-tailwind";
import type { InputConfig, ProcessedModel } from "./types.js";
import { getIcon, geistFontBase64 } from "./assets.js";

// Initialize Twind once
install({
  presets: [presetAutoprefix(), presetTailwind()],
});

// Layout constants (in pixels) - fixed padding throughout
export const PADDING_OUTER = 40; // Padding from viewport edge to white card
const PADDING_INNER = 40; // Padding inside the white card
const GAP_HEADER_CHART = 24; // Gap between header and chart area
const GAP_CHART_FOOTER = 24; // Gap between chart and footer
const GAP_TITLE_SUBTITLE = 4; // Gap between title and subtitle
const GAP_BETWEEN_BARS = 12; // Gap between bar rows

// Bar row dimensions
const ICON_SIZE = 48; // Icon width/height
const GAP_ICON_CONTENT = 16; // Gap between icon and bar content
const RANK_BADGE_SIZE = 28; // Rank badge width
const GAP_RANK_ICON = 16; // Gap between rank badge and icon
const BAR_LABEL_HEIGHT = 24; // Model name + percentage row height
const GAP_LABEL_BAR = 4; // Gap between label and bar
const BAR_HEIGHT = 28; // The actual bar height

// Header/footer heights (approximate)
const TITLE_HEIGHT = 36; // h1 text-3xl
const SUBTITLE_HEIGHT = 24; // p text

// Target output width - layout is scaled to achieve this
export const TARGET_OUTPUT_WIDTH = 1280;

// Aspect ratio (4:5)
const ASPECT_RATIO = 4 / 5;

export interface RenderOptions {
  /** 
   * If true, outputs a full standalone HTML document with inlined CSS and embedded font.
   * If false, outputs just the chart div with raw Tailwind classes (for web embedding).
   * Default: true
   */
  standalone?: boolean;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Get the icon SVG for a provider.
 * Uses bundled icons from assets.ts.
 */
function loadIcon(provider: string): string {
  const icon = getIcon(provider);
  // getIcon returns a placeholder span if not found, otherwise returns SVG
  if (icon.startsWith("<span")) {
    return icon;
  }
  return icon;
}

function getRankBadge(rank: number): { bg: string; text: string } {
  if (rank === 1) return { bg: "#F59E0B", text: "white" }; // gold
  if (rank === 2) return { bg: "#9CA3AF", text: "white" }; // silver
  if (rank === 3) return { bg: "#CD7F32", text: "white" }; // bronze
  return { bg: "#E6E7EB", text: "#6B7280" }; // light gray with dark text for 4+
}

function renderHorizontalChart(
  models: ProcessedModel[], 
  showRankings: boolean, 
  percentPrecision: number,
  barContainerWidth: number
): string {
  const rows = models.map(
    (m, index) => `
      <div class="flex items-center" style="gap: ${GAP_ICON_CONTENT}px;${index > 0 ? ` margin-top: ${GAP_BETWEEN_BARS}px;` : ""}">
        ${showRankings ? `
        <!-- Rank badge -->
        <div 
          class="rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
          style="width: ${RANK_BADGE_SIZE}px; height: ${RANK_BADGE_SIZE}px; margin-right: ${GAP_RANK_ICON - GAP_ICON_CONTENT}px; background-color: ${getRankBadge(m.rank).bg}; color: ${getRankBadge(m.rank).text};"
        >
          ${m.rank}
        </div>
        ` : ""}
        <!-- Icon -->
        <div class="shrink-0 flex items-center justify-center" style="width: ${ICON_SIZE}px; height: ${ICON_SIZE}px;">
          ${loadIcon(m.provider)}
        </div>
        
        <!-- Name + Bar stacked -->
        <div style="width: ${barContainerWidth}px;">
          <!-- Name row with percentage -->
          <div class="flex items-baseline justify-between" style="height: ${BAR_LABEL_HEIGHT}px; margin-bottom: ${GAP_LABEL_BAR}px;">
            <div class="flex items-baseline gap-2">
              <span class="text-lg text-gray-800">${escapeHtml(m.displayLabel)}</span>
              ${m.paramsLabel ? `<span class="text-gray-400 text-sm">${escapeHtml(m.paramsLabel)}</span>` : ""}
            </div>
            <span class="font-semibold text-lg text-gray-800">${m.percentage.toFixed(percentPrecision)}%</span>
          </div>
          
          <!-- Bar container (fixed width) -->
          <div class="bg-gray-200 rounded-full overflow-hidden" style="height: ${BAR_HEIGHT}px;">
            <div 
              class="h-full rounded-full flex items-center justify-end pr-3"
              style="width: ${m.percentage.toFixed(1)}%; background-color: ${m.color ?? m.providerConfig.color};"
            >
              ${!m.usePercent ? `<span class="text-xs font-medium text-white drop-shadow-sm">
                ${m.positive}/${m.total}
              </span>` : ""}
            </div>
          </div>
        </div>
      </div>`
  );
  return `<div class="flex flex-col">${rows.join("\n")}</div>`;
}

/**
 * Calculate layout dimensions based on content.
 * Height is determined by content (fixed elements + number of bars).
 * Width is calculated from height to achieve 4:5 aspect ratio.
 * Bar container width is the variable that adjusts.
 */
export function calculateLayoutDimensions(
  modelCount: number,
  hasSubtitle: boolean,
  hasFooter: boolean,
  showRankings: boolean
): { barContainerWidth: number; cardWidth: number; cardHeight: number } {
  // Calculate content height
  const headerHeight = TITLE_HEIGHT + (hasSubtitle ? GAP_TITLE_SUBTITLE + SUBTITLE_HEIGHT : 0);
  const footerHeight = hasFooter ? SUBTITLE_HEIGHT : 0;
  
  // Each bar row: label + gap + bar
  const barRowHeight = BAR_LABEL_HEIGHT + GAP_LABEL_BAR + BAR_HEIGHT;
  // Total chart height: bars + gaps between them
  const chartHeight = (barRowHeight * modelCount) + (GAP_BETWEEN_BARS * (modelCount - 1));
  
  // Total card content height
  const contentHeight = 
    headerHeight + 
    GAP_HEADER_CHART + 
    chartHeight + 
    (hasFooter ? GAP_CHART_FOOTER + footerHeight : 0);
  
  // Card height = content + inner padding
  const cardHeight = contentHeight + (PADDING_INNER * 2);
  
  // Card width from aspect ratio (width = height * aspect_ratio)
  const cardWidth = cardHeight * ASPECT_RATIO;
  
  // Calculate bar container width from card width
  const fixedRowWidth = 
    (showRankings ? RANK_BADGE_SIZE + GAP_RANK_ICON : 0) +
    ICON_SIZE +
    GAP_ICON_CONTENT;
  
  const barContainerWidth = cardWidth - (PADDING_INNER * 2) - fixedRowWidth;
  
  return { barContainerWidth, cardWidth, cardHeight };
}

/**
 * Render the chart as HTML.
 * 
 * @param config - The parsed input configuration
 * @param models - The processed and sorted models
 * @param options - Render options (standalone mode, etc.)
 * @returns HTML string (full document if standalone, chart div only if not)
 */
export function renderChart(
  config: InputConfig,
  models: ProcessedModel[],
  options: RenderOptions = {}
): string {
  const { standalone = true } = options;
  const showRankings = config.showRankings ?? false;
  const percentPrecision = config.percentPrecision ?? 0;
  
  // Calculate layout dimensions based on content
  const { barContainerWidth, cardWidth, cardHeight } = calculateLayoutDimensions(
    models.length,
    !!config.subtitle,
    !!config.sponsoredBy,
    showRankings
  );
  
  const chartHtml = renderHorizontalChart(models, showRankings, percentPrecision, barContainerWidth);

  // Build the card content
  const cardContent = `
    <!-- Header -->
    <div style="margin-bottom: ${GAP_HEADER_CHART}px;">
      <h1 class="text-3xl font-bold text-gray-900">${escapeHtml(config.title)}</h1>
      ${config.subtitle ? `<p class="text-gray-500" style="margin-top: ${GAP_TITLE_SUBTITLE}px;">${escapeHtml(config.subtitle)}</p>` : ""}
    </div>
    
    <!-- Chart -->
    <div class="flex-1">
      ${chartHtml}
    </div>
    
    <!-- Footer -->
    ${
      config.sponsoredBy
        ? `
    <div style="margin-top: ${GAP_CHART_FOOTER}px;">
      <p class="text-sm text-gray-400 text-right">Sponsored by <span class="font-semibold text-gray-600">${escapeHtml(config.sponsoredBy)}</span></p>
    </div>`
        : ""
    }
  `;

  // For web embedding (non-standalone), return just the chart div with raw Tailwind classes
  if (!standalone) {
    return `
      <div 
        id="llmplot-chart" 
        class="bg-white rounded-xl shadow-sm flex flex-col" 
        style="width: ${cardWidth}px; height: ${cardHeight}px; padding: ${PADDING_INNER}px;"
      >
        ${cardContent}
      </div>
    `;
  }

  // For standalone (CLI), use Twind to inline CSS and embed font
  const requestedFont = config.font ?? "Geist Sans";
  const fontFamily = `'${requestedFont}', ui-sans-serif, system-ui, sans-serif`;
  
  const fontFaceRule = `
    @font-face {
      font-family: '${requestedFont}';
      src: url(data:font/woff2;base64,${geistFontBase64}) format('woff2');
      font-weight: 400;
      font-style: normal;
      font-display: swap;
    }
  `;

  const rawHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(config.title)}</title>
  <style>${fontFaceRule}</style>
</head>
<body class="bg-gray-100 flex items-center justify-center" style="font-family: ${fontFamily}; padding: ${PADDING_OUTER}px;">
  <div id="llmplot-chart" class="bg-white rounded-xl shadow-sm flex flex-col" style="width: ${cardWidth}px; height: ${cardHeight}px; padding: ${PADDING_INNER}px;">
    ${cardContent}
  </div>
</body>
</html>`;

  // Process with Twind - extracts used classes and injects <style> into <head>
  return inline(rawHtml);
}
