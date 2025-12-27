import puppeteer from "puppeteer";

export type ExportFormat = "png" | "svg";

export interface ImageDimensions {
  width?: number;
  height?: number;
}

// Default aspect ratio 4:5 (width:height) optimized for social media
const DEFAULT_WIDTH = 1080;
const ASPECT_RATIO = 4 / 5;

/**
 * Calculate dimensions with 4:5 aspect ratio default.
 * If only width provided, calculate height from aspect ratio.
 * If only height provided, calculate width from aspect ratio.
 * If neither provided, use defaults (1080x1350).
 */
function calculateDimensions(dims?: ImageDimensions): { width: number; height: number } {
  const { width, height } = dims ?? {};

  if (width && height) {
    return { width, height };
  }

  if (width) {
    return { width, height: Math.round(width / ASPECT_RATIO) };
  }

  if (height) {
    return { width: Math.round(height * ASPECT_RATIO), height };
  }

  return { width: DEFAULT_WIDTH, height: Math.round(DEFAULT_WIDTH / ASPECT_RATIO) };
}

/**
 * Render HTML content to an image file (PNG or SVG).
 * Uses a headless browser to capture the viewport.
 */
export async function renderToImage(
  html: string,
  outputPath: string,
  format: ExportFormat,
  dimensions?: ImageDimensions
): Promise<void> {
  const { width, height } = calculateDimensions(dimensions);

  const browser = await puppeteer.launch({
    headless: true,
  });

  try {
    const page = await browser.newPage();

    // Set viewport to requested dimensions
    await page.setViewport({
      width,
      height,
      deviceScaleFactor: 2, // Retina quality
    });

    // Load the HTML content
    await page.setContent(html, {
      waitUntil: "networkidle0",
    });

    // Capture the full viewport
    const clip = {
      x: 0,
      y: 0,
      width,
      height,
    };

    if (format === "png") {
      await page.screenshot({
        path: outputPath,
        type: "png",
        clip,
        omitBackground: false,
      });
    } else {
      // SVG export: Embed a high-resolution PNG as base64 inside an SVG
      // This ensures perfect rendering while providing a scalable format
      const pngBuffer = await page.screenshot({
        type: "png",
        clip,
        omitBackground: false,
        encoding: "binary",
      });

      const base64Png = Buffer.from(pngBuffer).toString("base64");
      const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" 
     xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${clip.width}" 
     height="${clip.height}" 
     viewBox="0 0 ${clip.width} ${clip.height}">
  <image width="${clip.width}" height="${clip.height}" 
         xlink:href="data:image/png;base64,${base64Png}"/>
</svg>`;

      await Bun.write(outputPath, svgContent);
    }
  } finally {
    await browser.close();
  }
}

/**
 * Determine the export format from a file path extension.
 * Returns null if the extension is not a supported image format.
 */
export function getExportFormat(filePath: string): ExportFormat | null {
  const ext = filePath.toLowerCase().split(".").pop();
  if (ext === "png") return "png";
  if (ext === "svg") return "svg";
  return null;
}
