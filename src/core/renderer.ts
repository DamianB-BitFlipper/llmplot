import { inline, install } from "@twind/core";
import presetAutoprefix from "@twind/preset-autoprefix";
import presetTailwind from "@twind/preset-tailwind";
import type { InputConfig, ProcessedModel } from "./types.js";
import { geistFontBase64 } from "./assets.js";

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

// Minimum bar container width as percentage of TARGET_OUTPUT_WIDTH
const MIN_BAR_CONTAINER_WIDTH_RATIO = 0.3;
const MIN_BAR_CONTAINER_WIDTH = TARGET_OUTPUT_WIDTH * MIN_BAR_CONTAINER_WIDTH_RATIO; // 384px

export type RenderMode = 'cli' | 'web';

export interface RenderOptions {
  /** 
   * 'cli' - Full standalone HTML document with gray background, inlined CSS, embedded font
   * 'web' - Self-contained fragment (<style> + <div>) for embedding, with inlined CSS and embedded font
   */
  mode: RenderMode;
  /**
   * Scale factor for the chart (default: 1.0).
   * In web mode, wraps the chart in a CSS transform container.
   * The chart is rendered at full size internally, then scaled via CSS transform.
   */
  scale?: number;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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
          ${m.providerConfig.iconSvg}
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
 * 
 * If the bar container width would be too narrow, we enforce a minimum
 * and add extra vertical padding to maintain the 4:5 aspect ratio.
 */
export function calculateLayoutDimensions(
  modelCount: number,
  hasSubtitle: boolean,
  hasFooter: boolean,
  showRankings: boolean
): { barContainerWidth: number; cardWidth: number; cardHeight: number; extraVerticalPadding: number } {
  // Calculate content height
  const headerHeight = TITLE_HEIGHT + (hasSubtitle ? GAP_TITLE_SUBTITLE + SUBTITLE_HEIGHT : 0);
  const footerHeight = hasFooter ? SUBTITLE_HEIGHT : 0;
  
  // Each bar row: label + gap + bar
  const barRowHeight = BAR_LABEL_HEIGHT + GAP_LABEL_BAR + BAR_HEIGHT;
  // Total chart height: bars + gaps between them
  const chartHeight = (barRowHeight * modelCount) + (GAP_BETWEEN_BARS * (modelCount - 1));
  
  // Total card content height (without padding)
  const contentHeight = 
    headerHeight + 
    GAP_HEADER_CHART + 
    chartHeight + 
    (hasFooter ? GAP_CHART_FOOTER + footerHeight : 0);
  
  // Fixed row width (icon + optional rank badge)
  const fixedRowWidth = 
    (showRankings ? RANK_BADGE_SIZE + GAP_RANK_ICON : 0) +
    ICON_SIZE +
    GAP_ICON_CONTENT;
  
  // Initial calculation based on content height
  let cardHeight = contentHeight + (PADDING_INNER * 2);
  let cardWidth = cardHeight * ASPECT_RATIO;
  let barContainerWidth = cardWidth - (PADDING_INNER * 2) - fixedRowWidth;
  let extraVerticalPadding = 0;
  
  // If bar container is too narrow, enforce minimum and expand card height
  if (barContainerWidth < MIN_BAR_CONTAINER_WIDTH) {
    barContainerWidth = MIN_BAR_CONTAINER_WIDTH;
    cardWidth = barContainerWidth + fixedRowWidth + (PADDING_INNER * 2);
    cardHeight = cardWidth / ASPECT_RATIO;
    
    // Calculate extra vertical space and distribute evenly top/bottom
    const minCardHeight = contentHeight + (PADDING_INNER * 2);
    extraVerticalPadding = (cardHeight - minCardHeight) / 2;
  }
  
  return { barContainerWidth, cardWidth, cardHeight, extraVerticalPadding };
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
  options: RenderOptions
): string {
  const { mode, scale = 1 } = options;
  const showRankings = config.showRankings;
  const percentPrecision = config.percentPrecision;
  
  // Calculate layout dimensions based on content
  const { barContainerWidth, cardWidth, cardHeight, extraVerticalPadding } = calculateLayoutDimensions(
    models.length,
    !!config.subtitle,
    !!config.sponsoredBy,
    showRankings
  );
  
  // Calculate vertical padding (inner padding + extra padding for aspect ratio)
  const verticalPadding = PADDING_INNER + extraVerticalPadding;
  
  const chartHtml = renderHorizontalChart(models, showRankings, percentPrecision, barContainerWidth);

  const useCustomFont = !!config.font;
  const fontName = config.font ?? "Geist Sans";
  const fontFamily = `'${fontName}', ui-sans-serif, system-ui, sans-serif`;
  
  // Only embed Geist font if using the default font
  const fontFaceRule = useCustomFont ? "" : `
    @font-face {
      font-family: 'Geist Sans';
      src: url(data:font/woff2;base64,${geistFontBase64}) format('woff2');
      font-weight: 400;
      font-style: normal;
      font-display: swap;
    }
  `;

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

  if (mode === 'web') {
    // Web mode: Self-contained fragment with inlined CSS and embedded font
    const chartDiv = `
      <div 
        id="llmplot-chart" 
        class="bg-white rounded-xl shadow-sm flex flex-col" 
        style="font-family: ${fontFamily}; width: ${cardWidth}px; min-height: ${cardHeight}px; padding: ${verticalPadding}px ${PADDING_INNER}px;"
      >
        ${cardContent}
      </div>
    `;

    // Apply scale wrapper if scale !== 1
    const needsScaling = scale !== 1;
    const scaledWidth = cardWidth * scale;
    const scaledHeight = cardHeight * scale;

    const rawHtml = needsScaling
      ? `
      <style>${fontFaceRule}</style>
      <div style="width: ${scaledWidth}px; height: ${scaledHeight}px; overflow: hidden;">
        <div style="transform: scale(${scale}); transform-origin: top left;">
          ${chartDiv}
        </div>
      </div>
    `
      : `
      <style>${fontFaceRule}</style>
      ${chartDiv}
    `;
    return inline(rawHtml);
  }

  // CLI mode: Full HTML document
  const rawHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(config.title)}</title>
  <style>${fontFaceRule}</style>
</head>
<body class="bg-gray-100 flex items-center justify-center" style="font-family: ${fontFamily}; padding: ${PADDING_OUTER}px;">
  <div id="llmplot-chart" class="bg-white rounded-xl shadow-sm flex flex-col" style="width: ${cardWidth}px; height: ${cardHeight}px; padding: ${verticalPadding}px ${PADDING_INNER}px;">
    ${cardContent}
  </div>
</body>
</html>`;

  // Process with Twind - extracts used classes and injects <style> into <head>
  return inline(rawHtml);
}
