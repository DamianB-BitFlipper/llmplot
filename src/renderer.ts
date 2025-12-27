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

// Cache for loaded fonts
const fontCache = new Map<string, string | null>();

/**
 * Map font names to their file names in assets/fonts/
 */
const embeddedFonts: Record<string, string> = {
  "geist sans": "Geist-Regular.woff2",
};

/**
 * Load a font as base64 for embedding.
 * Returns base64 string if found, null if not available.
 */
async function loadEmbeddedFont(fontName: string): Promise<string | null> {
  const normalizedName = fontName.toLowerCase();
  
  // Check cache
  if (fontCache.has(normalizedName)) {
    return fontCache.get(normalizedName) ?? null;
  }

  // Look up the font file name
  const fileName = embeddedFonts[normalizedName];
  if (!fileName) {
    fontCache.set(normalizedName, null);
    return null;
  }

  const fontPath = new URL(`../assets/fonts/${fileName}`, import.meta.url).pathname;
  const file = Bun.file(fontPath);

  if (!(await file.exists())) {
    fontCache.set(normalizedName, null);
    return null;
  }

  try {
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    fontCache.set(normalizedName, base64);
    return base64;
  } catch {
    fontCache.set(normalizedName, null);
    return null;
  }
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

async function renderHorizontalChart(
  models: ProcessedModel[], 
  showRankings: boolean, 
  percentPrecision: number,
  barContainerWidth: number
): Promise<string> {
  const rows = await Promise.all(
    models.map(
      async (m, index) => `
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
          ${await loadIcon(m.providerConfig.iconPath, m.provider)}
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
    )
  );
  return `<div class="flex flex-col">${rows.join("\n")}</div>`;
}

async function renderVerticalChart(models: ProcessedModel[], showRankings: boolean, percentPrecision: number): Promise<string> {
  const columns = await Promise.all(
    models.map(
      async (m) => `
        <div class="flex flex-col items-center gap-2" style="width: 70px; flex-shrink: 0;">
          <!-- Bar container -->
          <div class="w-10 bg-gray-200 rounded-full flex flex-col justify-end overflow-hidden" style="height: 200px;">
            <div 
              class="w-full rounded-full flex items-start justify-center pt-2"
              style="height: ${m.percentage.toFixed(1)}%; background-color: ${m.color ?? m.providerConfig.color};"
            >
              <span class="text-xs font-semibold text-white drop-shadow-sm">
                ${m.percentage.toFixed(percentPrecision)}%
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
          <div class="w-8 h-8 flex items-center justify-center shrink-0">
            ${await loadIcon(m.providerConfig.iconPath, m.provider)}
          </div>
          
          <!-- Model name -->
          <div class="text-xs text-gray-600 text-center overflow-hidden" style="width: 70px;" title="${escapeHtml(m.displayLabel)}">
            <span class="block truncate">${escapeHtml(m.displayLabel)}</span>
          </div>
        </div>`
    )
  );
  return `
    <div class="flex items-end justify-start gap-2 overflow-x-auto pb-2">
      ${columns.join("\n")}
    </div>`;
}

function getRankBadge(rank: number): { bg: string; text: string } {
  if (rank === 1) return { bg: "#F59E0B", text: "white" }; // gold
  if (rank === 2) return { bg: "#9CA3AF", text: "white" }; // silver
  if (rank === 3) return { bg: "#CD7F32", text: "white" }; // bronze
  return { bg: "#E6E7EB", text: "#6B7280" }; // light gray with dark text for 4+
}

// Layout constants (in pixels) - fixed padding for consistent 4:5 aspect ratio
export const PADDING_OUTER = 40; // Padding from viewport edge to white card
const PADDING_INNER = 40; // Padding inside the white card
const GAP_HEADER_CHART = 24; // Gap between header and chart area
const GAP_CHART_FOOTER = 24; // Gap between chart and footer
const GAP_BETWEEN_BARS = 12; // Gap between bar rows

// Bar row dimensions
const ICON_SIZE = 48; // Icon width/height
const GAP_ICON_CONTENT = 16; // Gap between icon and bar content
const RANK_BADGE_SIZE = 28; // Rank badge width
const GAP_RANK_ICON = 16; // Gap between rank badge and icon

// Typography heights (approximate)
const TITLE_HEIGHT = 36; // h1 line height
const SUBTITLE_HEIGHT = 24; // subtitle line height
const GAP_TITLE_SUBTITLE = 4; // gap between title and subtitle
const FOOTER_HEIGHT = 20; // footer line height
const BAR_LABEL_HEIGHT = 24; // model name + percentage row
const GAP_LABEL_BAR = 4; // gap between label and bar
const BAR_HEIGHT = 28; // the actual bar height

export interface LayoutDimensions {
  barContainerWidth: number;
  cardWidth: number;
  cardHeight: number;
  viewportWidth: number;
  viewportHeight: number;
}

/**
 * Calculate dimensions needed for layout.
 * The white card has a 4:5 aspect ratio, and the viewport is sized to fit it.
 * Returns card dimensions, bar container width, and viewport dimensions.
 */
export function calculateLayoutDimensions(
  modelCount: number,
  hasSubtitle: boolean,
  hasFooter: boolean,
  showRankings: boolean
): LayoutDimensions {
  // Calculate total vertical space used by fixed elements inside the card
  const headerHeight = TITLE_HEIGHT + (hasSubtitle ? GAP_TITLE_SUBTITLE + SUBTITLE_HEIGHT : 0);
  const footerHeight = hasFooter ? FOOTER_HEIGHT : 0;
  
  // Each bar row: label + gap + bar
  const barRowHeight = BAR_LABEL_HEIGHT + GAP_LABEL_BAR + BAR_HEIGHT;
  // Total chart area height: all rows + gaps between them
  const chartAreaHeight = (barRowHeight * modelCount) + (GAP_BETWEEN_BARS * (modelCount - 1));
  
  // Total card height (inner content + inner padding)
  const cardHeight = 
    PADDING_INNER * 2 +  // inner padding top + bottom
    headerHeight +
    GAP_HEADER_CHART +
    chartAreaHeight +
    (hasFooter ? GAP_CHART_FOOTER + footerHeight : 0);
  
  // Width taken by icon and optional rank badge in each row
  const fixedRowWidth = 
    (showRankings ? RANK_BADGE_SIZE + GAP_RANK_ICON : 0) +
    ICON_SIZE +
    GAP_ICON_CONTENT;
  
  // Calculate card width based on 4:5 aspect ratio
  // width / height = 4/5, so width = height * 4/5
  const cardWidth = cardHeight * (4 / 5);
  
  // Bar container width = card inner width - fixed elements
  const barContainerWidth = cardWidth - (PADDING_INNER * 2) - fixedRowWidth;
  
  // Viewport = card + outer padding on all sides
  const viewportWidth = cardWidth + (PADDING_OUTER * 2);
  const viewportHeight = cardHeight + (PADDING_OUTER * 2);
  
  return {
    barContainerWidth: Math.max(200, barContainerWidth),
    cardWidth,
    cardHeight,
    viewportWidth,
    viewportHeight
  };
}

export async function renderHtml(config: InputConfig, models: ProcessedModel[]): Promise<string> {
  const isVertical = config.orientation === "vertical";
  const showRankings = config.showRankings ?? false;
  
  // Default font is Geist Sans
  const requestedFont = config.font ?? "Geist Sans";
  
  // Try to load embedded font
  const embeddedBase64 = await loadEmbeddedFont(requestedFont);
  
  // Determine font family CSS and @font-face rule
  let fontFamily: string;
  let fontFaceRule = "";
  
  if (embeddedBase64) {
    // Embedded font found - use it with fallback
    fontFamily = `'${requestedFont}', ui-sans-serif, system-ui, sans-serif`;
    fontFaceRule = `
    @font-face {
      font-family: '${requestedFont}';
      src: url(data:font/woff2;base64,${embeddedBase64}) format('woff2');
      font-weight: 400;
      font-style: normal;
      font-display: swap;
    }
    `;
  } else if (config.font) {
    // Custom font specified but not embedded - try as system font
    fontFamily = `'${requestedFont}', ui-sans-serif, system-ui, sans-serif`;
  } else {
    // No font specified and default not available - use system fonts
    fontFamily = `ui-sans-serif, system-ui, sans-serif`;
  }
  
  // Calculate layout dimensions for 4:5 aspect ratio
  const { barContainerWidth, cardWidth, cardHeight } = calculateLayoutDimensions(
    models.length,
    !!config.subtitle,
    !!config.sponsoredBy,
    showRankings
  );
  
  const percentPrecision = config.percentPrecision ?? 0;
  const chartHtml = isVertical 
    ? await renderVerticalChart(models, showRankings, percentPrecision) 
    : await renderHorizontalChart(models, showRankings, percentPrecision, barContainerWidth);

  const rawHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(config.title)}</title>
  ${fontFaceRule ? `<style>${fontFaceRule}</style>` : ""}
</head>
<body class="h-screen w-screen bg-gray-100 flex items-center justify-center overflow-hidden" style="font-family: ${fontFamily}; padding: ${PADDING_OUTER}px;">
  <div id="llmplot-chart" class="bg-white rounded-xl shadow-sm flex flex-col" style="width: ${cardWidth}px; height: ${cardHeight}px; padding: ${PADDING_INNER}px;">
    <!-- Header -->
    <div style="margin-bottom: ${GAP_HEADER_CHART}px;">
      <h1 class="text-3xl font-bold text-gray-900" style="line-height: ${TITLE_HEIGHT}px;">${escapeHtml(config.title)}</h1>
      ${config.subtitle ? `<p class="text-gray-500" style="margin-top: ${GAP_TITLE_SUBTITLE}px; line-height: ${SUBTITLE_HEIGHT}px;">${escapeHtml(config.subtitle)}</p>` : ""}
    </div>
    
    <!-- Chart -->
    <div>
      ${chartHtml}
    </div>
    
    <!-- Footer -->
    ${
      config.sponsoredBy
        ? `
    <div style="margin-top: ${GAP_CHART_FOOTER}px;">
      <p class="text-sm text-gray-400 text-right" style="line-height: ${FOOTER_HEIGHT}px;">Sponsored by <span class="font-semibold text-gray-600">${escapeHtml(config.sponsoredBy)}</span></p>
    </div>`
        : ""
    }
  </div>
</body>
</html>`;

  // Process with Twind - extracts used classes and injects <style> into <head>
  return inline(rawHtml);
}
