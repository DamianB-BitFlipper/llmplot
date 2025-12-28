/**
 * Bundled assets for llmplot core library.
 * Icons and fonts are imported using Bun's import attributes.
 */

// Provider SVG icons - imported as text content
import geminiIconSvg from "../../assets/icons/gemini.svg" with { type: "text" };
import metaIconSvg from "../../assets/icons/meta.svg" with { type: "text" };
import primeIntellectIconSvg from "../../assets/icons/prime-intellect.svg" with { type: "text" };
import xaiIconSvg from "../../assets/icons/xai.svg" with { type: "text" };
import openaiIconSvg from "../../assets/icons/openai.svg" with { type: "text" };
import mistralIconSvg from "../../assets/icons/mistral.svg" with { type: "text" };
import deepseekIconSvg from "../../assets/icons/deepseek.svg" with { type: "text" };
import qwenIconSvg from "../../assets/icons/qwen.svg" with { type: "text" };
import anthropicIconSvg from "../../assets/icons/anthropic.svg" with { type: "text" };
import cohereIconSvg from "../../assets/icons/cohere.svg" with { type: "text" };
import zhipuIconSvg from "../../assets/icons/zhipu.svg" with { type: "text" };

/**
 * Convert an SVG string to a base64 data URL.
 */
function svgToDataUrl(svg: string): string {
  const base64 = btoa(svg);
  return `data:image/svg+xml;base64,${base64}`;
}

export const icons: Record<string, string> = {
  gemini: svgToDataUrl(geminiIconSvg),
  meta: svgToDataUrl(metaIconSvg),
  "prime-intellect": svgToDataUrl(primeIntellectIconSvg),
  xai: svgToDataUrl(xaiIconSvg),
  openai: svgToDataUrl(openaiIconSvg),
  mistral: svgToDataUrl(mistralIconSvg),
  deepseek: svgToDataUrl(deepseekIconSvg),
  qwen: svgToDataUrl(qwenIconSvg),
  anthropic: svgToDataUrl(anthropicIconSvg),
  cohere: svgToDataUrl(cohereIconSvg),
  zhipu: svgToDataUrl(zhipuIconSvg),
};

// Geist Sans Regular font - imported as file URL for bundling
import geistFontUrl from "../../assets/fonts/Geist-Regular.woff2" with { type: "file" };
export { geistFontUrl };

/**
 * Create a placeholder SVG with provider initials as a data URL.
 */
function createPlaceholderIcon(initials: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
    <rect width="48" height="48" fill="#E5E7EB" rx="8"/>
    <text x="24" y="24" fill="#9CA3AF" font-family="system-ui, sans-serif" font-size="16" font-weight="600" text-anchor="middle" dominant-baseline="central">${initials}</text>
  </svg>`;
  return svgToDataUrl(svg);
}

/**
 * Get an icon URL by provider name.
 * Returns a placeholder if icon not found.
 */
export function getIcon(provider: string): string {
  const icon = icons[provider.toLowerCase()];
  if (icon) return icon;

  // Return placeholder SVG with provider initials
  const initials = provider.slice(0, 2).toUpperCase();
  return createPlaceholderIcon(initials);
}
