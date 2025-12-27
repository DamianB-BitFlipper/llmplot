import puppeteer from "puppeteer";

export type ExportFormat = "png" | "svg";

export interface ImageDimensions {
  width: number;
  height: number;
}

/**
 * Render HTML content to an image file (PNG or SVG).
 * Uses a headless browser to capture the viewport.
 */
export async function renderToImage(
  html: string,
  outputPath: string,
  format: ExportFormat,
  dimensions: ImageDimensions
): Promise<void> {
  const { width, height } = dimensions;

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
