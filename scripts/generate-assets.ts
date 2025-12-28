/**
 * Generates src/core/assets.ts with inline base64 data URLs.
 *
 * Usage:
 *   bun run scripts/generate-assets.ts          # One-time generation
 *   bun run scripts/generate-assets.ts --watch  # Watch mode
 */
import { watch } from "fs";

const ASSETS_DIR = "./common_assets";
const ICONS_DIR = `${ASSETS_DIR}/provider_logos`;
const FONTS_DIR = `${ASSETS_DIR}/fonts`;
const OUTPUT_PATH = "./src/core/assets.ts";

// Font files to bundle (order matters for the exported type)
const FONT_FILES = [
  { name: "geist", file: "Geist.ttf" },
  { name: "ibm-plex-sans", file: "IBMPlexSans.ttf" },
  { name: "inter", file: "Inter.ttf" },
  { name: "libre-baskerville", file: "LibreBaskerville.ttf" },
  { name: "manrope", file: "Manrope.ttf" },
  { name: "sora", file: "Sora.ttf" },
  { name: "space-grotesk", file: "SpaceGrotesk.ttf" },
] as const;

async function getIconFiles(): Promise<{ name: string; path: string }[]> {
  const glob = new Bun.Glob("*.svg");
  const files: { name: string; path: string }[] = [];

  for await (const file of glob.scan(ICONS_DIR)) {
    const name = file.replace(".svg", "");
    files.push({ name, path: `${ICONS_DIR}/${file}` });
  }

  // Sort alphabetically for consistent output
  return files.sort((a, b) => a.name.localeCompare(b.name));
}

function svgToDataUrl(svg: string): string {
  const base64 = btoa(svg);
  return `data:image/svg+xml;base64,${base64}`;
}

function fontToDataUrl(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return `data:font/ttf;base64,${base64}`;
}

async function generate(): Promise<void> {
  const startTime = performance.now();

  // Read all SVG icons
  const iconFiles = await getIconFiles();
  const icons: Record<string, string> = {};

  for (const { name, path } of iconFiles) {
    const file = Bun.file(path);
    const svg = await file.text();
    icons[name] = svgToDataUrl(svg);
  }

  // Read all font files
  const fonts: Record<string, string> = {};
  for (const { name, file } of FONT_FILES) {
    const fontFile = Bun.file(`${FONTS_DIR}/${file}`);
    const fontBuffer = await fontFile.arrayBuffer();
    fonts[name] = fontToDataUrl(fontBuffer);
  }

  // Generate font family names for CSS
  const fontFamilyNames: Record<string, string> = {
    "geist": "Geist",
    "ibm-plex-sans": "IBM Plex Sans",
    "inter": "Inter",
    "libre-baskerville": "Libre Baskerville",
    "manrope": "Manrope",
    "sora": "Sora",
    "space-grotesk": "Space Grotesk",
  };

  // Generate TypeScript code
  const code = `/**
 * AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY
 * Run \`bun run generate:assets\` to regenerate from source files in common_assets/
 */

export const icons: Record<string, string> = {
${Object.entries(icons)
  .map(([name, dataUrl]) => `  "${name}": "${dataUrl}",`)
  .join("\n")}
};

/** Available font families */
export const fontFamilies = ["geist", "ibm-plex-sans", "inter", "libre-baskerville", "manrope", "sora", "space-grotesk"] as const;
export type FontFamily = typeof fontFamilies[number];

/** Font data URLs keyed by font family */
export const fonts: Record<FontFamily, string> = {
${Object.entries(fonts)
  .map(([name, dataUrl]) => `  "${name}": "${dataUrl}",`)
  .join("\n")}
};

/** CSS font-family names for each font */
export const fontFamilyNames: Record<FontFamily, string> = {
${Object.entries(fontFamilyNames)
  .map(([name, family]) => `  "${name}": "${family}",`)
  .join("\n")}
};

/** Default font family */
export const defaultFont: FontFamily = "sora";

/** Get font data URL by font family name */
export function getFontUrl(font: FontFamily = defaultFont): string {
  return fonts[font] ?? fonts[defaultFont];
}

/** Get CSS font-family name */
export function getFontFamilyName(font: FontFamily = defaultFont): string {
  return fontFamilyNames[font] ?? fontFamilyNames[defaultFont];
}

/**
 * Create a placeholder SVG with provider initials as a data URL.
 */
function createPlaceholderIcon(initials: string): string {
  const svg = \`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
    <rect width="48" height="48" fill="#E5E7EB" rx="8"/>
    <text x="24" y="24" fill="#9CA3AF" font-family="system-ui, sans-serif" font-size="16" font-weight="600" text-anchor="middle" dominant-baseline="central">\${initials}</text>
  </svg>\`;
  return \`data:image/svg+xml;base64,\${btoa(svg)}\`;
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
`;

  // Write output file
  await Bun.write(OUTPUT_PATH, code);

  const elapsed = (performance.now() - startTime).toFixed(0);
  console.log(`Generated ${OUTPUT_PATH} (${iconFiles.length} icons, ${FONT_FILES.length} fonts) in ${elapsed}ms`);
}

// Main
const isWatch = process.argv.includes("--watch");

if (isWatch) {
  await generate(); // Initial generation
  console.log(`Watching ${ASSETS_DIR}/ for changes...`);
  watch(ASSETS_DIR, { recursive: true }, async (event, filename) => {
    console.log(`Asset changed: ${filename}`);
    await generate();
  });
} else {
  await generate();
}
