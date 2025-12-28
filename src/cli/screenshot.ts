/**
 * Screenshot/image export functionality using Puppeteer.
 * CLI-only - requires server-side execution.
 */

import puppeteer from "puppeteer";

export type ExportFormat = "png" | "svg";

interface ImageDimensions {
  width: number;
  height: number;
  scaleFactor?: number;
}

/**
 * Render HTML to an image file (PNG or SVG).
 */
export async function renderToImage(
  html: string,
  outputPath: string,
  format: ExportFormat,
  dimensions: ImageDimensions
): Promise<void> {
  const { width, height, scaleFactor = 2 } = dimensions;

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();

    await page.setViewport({
      width: Math.ceil(width),
      height: Math.ceil(height),
      deviceScaleFactor: scaleFactor,
    });

    await page.setContent(html, {
      waitUntil: "networkidle0",
    });

    const clip = {
      x: 0,
      y: 0,
      width: Math.ceil(width),
      height: Math.ceil(height),
    };

    if (format === "svg") {
      // Output dimensions after scaling
      const outputWidth = Math.round(width * scaleFactor);
      const outputHeight = Math.round(height * scaleFactor);
      // SVG export: Embed a high-resolution PNG as base64 inside an SVG
      // This ensures perfect rendering while providing a scalable format
      const pngBuffer = await page.screenshot({
        type: "png",
        clip,
        omitBackground: false,
        encoding: "binary",
      });

      const base64Png = Buffer.from(pngBuffer).toString("base64");
      const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" 
     xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${outputWidth}" 
     height="${outputHeight}" 
     viewBox="0 0 ${outputWidth} ${outputHeight}">
  <image width="${outputWidth}" height="${outputHeight}" 
         xlink:href="data:image/png;base64,${base64Png}"/>
</svg>`;

      await Bun.write(outputPath, svg);
    } else {
      // PNG screenshot
      await page.screenshot({
        path: outputPath,
        type: "png",
        clip,
      });
    }
  } finally {
    await browser.close();
  }
}

/**
 * Determine export format from file extension.
 */
export function getExportFormat(filePath: string): ExportFormat | null {
  const ext = filePath.toLowerCase().split(".").pop();
  if (ext === "png") return "png";
  if (ext === "svg") return "svg";
  return null;
}
