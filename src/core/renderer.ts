import { inline, install } from "@twind/core";
import presetAutoprefix from "@twind/preset-autoprefix";
import presetTailwind from "@twind/preset-tailwind";
import type { InputConfig, ProcessedModel } from "./types.js";
import { fonts, type FontFamily } from "./assets.js";

/** Map font family keys to display names */
const fontDisplayNames: Record<FontFamily, string> = {
  "geist": "Geist Sans",
  "ibm-plex-sans": "IBM Plex Sans",
  "inter": "Inter",
  "libre-baskerville": "Libre Baskerville",
  "manrope": "Manrope",
  "sora": "Sora",
  "space-grotesk": "Space Grotesk",
};

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
          <img src="${m.providerConfig.iconUrl}" alt="" style="width: ${ICON_SIZE}px; height: ${ICON_SIZE}px;" />
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
                ${m.passed}/${m.total}
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
 * 
 * The background layer is always exactly 4:5 aspect ratio.
 * The card shrinks in width to fit, with fixed padding from background edges.
 * When min bar width is reached, background grows taller and card is centered via flexbox.
 */
export function calculateLayoutDimensions(
  modelCount: number,
  hasSubtitle: boolean,
  hasFooter: boolean,
  showRankings: boolean
): { barContainerWidth: number; cardWidth: number; cardHeight: number; backgroundWidth: number; backgroundHeight: number } {
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
  
  // Card height is always determined by content (tight fit)
  const cardHeight = contentHeight + (PADDING_INNER * 2);
  
  // Calculate ideal card width based on content height and aspect ratio
  // The card should be sized so that background (card + outer padding) is 4:5
  // backgroundWidth = cardWidth + 2*PADDING_OUTER
  // backgroundHeight = cardHeight + 2*PADDING_OUTER (in ideal case)
  // For 4:5 ratio: backgroundWidth / backgroundHeight = 4/5
  // So: (cardWidth + 2*PADDING_OUTER) / (cardHeight + 2*PADDING_OUTER) = 4/5
  // cardWidth = (cardHeight + 2*PADDING_OUTER) * 4/5 - 2*PADDING_OUTER
  
  const idealBackgroundHeight = cardHeight + (PADDING_OUTER * 2);
  const idealBackgroundWidth = idealBackgroundHeight * ASPECT_RATIO;
  let cardWidth = idealBackgroundWidth - (PADDING_OUTER * 2);
  let barContainerWidth = cardWidth - (PADDING_INNER * 2) - fixedRowWidth;
  
  // If bar container is too narrow, enforce minimum
  if (barContainerWidth < MIN_BAR_CONTAINER_WIDTH) {
    barContainerWidth = MIN_BAR_CONTAINER_WIDTH;
    cardWidth = barContainerWidth + fixedRowWidth + (PADDING_INNER * 2);
  }
  
  // Background is always 4:5, sized to fit the card with outer padding
  const backgroundWidth = cardWidth + (PADDING_OUTER * 2);
  const backgroundHeight = backgroundWidth / ASPECT_RATIO;
  
  return { barContainerWidth, cardWidth, cardHeight, backgroundWidth, backgroundHeight };
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
  const { barContainerWidth, cardWidth, backgroundWidth, backgroundHeight } = calculateLayoutDimensions(
    models.length,
    !!config.subtitle,
    !!config.sponsoredBy,
    showRankings
  );
  
  const chartHtml = renderHorizontalChart(models, showRankings, percentPrecision, barContainerWidth);

  const fontKey: FontFamily = config.font ?? "sora";
  const fontName = fontDisplayNames[fontKey];
  const fontDataUrl = fonts[fontKey];
  const fontFamily = `'${fontName}', ui-sans-serif, system-ui, sans-serif`;
  
  // Always embed the selected font
  const fontFaceRule = `
    @font-face {
      font-family: '${fontName}';
      src: url(${fontDataUrl}) format('truetype');
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
    // Renders the same 4:5 background layer as CLI mode for consistent preview
    const backgroundDiv = `
      <div 
        id="llmplot-background"
        class="bg-gray-100 flex items-center justify-center"
        style="width: ${backgroundWidth}px; height: ${backgroundHeight}px; padding: ${PADDING_OUTER}px; box-sizing: border-box;"
      >
        <div 
          id="llmplot-chart" 
          class="bg-white rounded-xl shadow-sm flex flex-col" 
          style="font-family: ${fontFamily}; width: ${cardWidth}px; padding: ${PADDING_INNER}px;"
        >
          ${cardContent}
        </div>
      </div>
    `;

    const rawHtml = scale !== 1
      ? `
      <style>${fontFaceRule}</style>
      <div style="width: ${backgroundWidth * scale}px; height: ${backgroundHeight * scale}px; overflow: hidden;">
        <div style="transform: scale(${scale}); transform-origin: top left;">
          ${backgroundDiv}
        </div>
      </div>
    `
      : `
      <style>${fontFaceRule}</style>
      ${backgroundDiv}
    `;
    return inline(rawHtml);
  }

  // CLI mode: Full HTML document with background layer
  const rawHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(config.title)}</title>
  <style>${fontFaceRule}</style>
</head>
<body style="margin: 0; padding: 0;">
  <div id="llmplot-background" class="bg-gray-100 flex items-center justify-center" style="font-family: ${fontFamily}; width: ${backgroundWidth}px; height: ${backgroundHeight}px; padding: ${PADDING_OUTER}px; box-sizing: border-box;">
    <div id="llmplot-chart" class="bg-white rounded-xl shadow-sm flex flex-col" style="width: ${cardWidth}px; padding: ${PADDING_INNER}px;">
      ${cardContent}
    </div>
  </div>
</body>
</html>`;

  // Process with Twind - extracts used classes and injects <style> into <head>
  return inline(rawHtml);
}
