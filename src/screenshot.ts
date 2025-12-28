import puppeteer from "puppeteer";

export type ExportFormat = "png" | "svg";

export interface ImageDimensions {
  width: number;
  height: number;
  scaleFactor?: number; // Scale factor to achieve target output size
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
  const { width, height, scaleFactor = 1 } = dimensions;
  
  // Device scale factor combines base retina quality (2x) with content scaling
  const deviceScaleFactor = 2 * scaleFactor;

  const browser = await puppeteer.launch({
    headless: true,
  });

  try {
    const page = await browser.newPage();

    // Set viewport to content dimensions (scaling is handled by deviceScaleFactor)
    await page.setViewport({
      width: Math.round(width),
      height: Math.round(height),
      deviceScaleFactor,
    });

    // Load the HTML content
    await page.setContent(html, {
      waitUntil: "networkidle0",
    });

    // Capture the full viewport
    const clip = {
      x: 0,
      y: 0,
      width: Math.round(width),
      height: Math.round(height),
    };
    
    // Output dimensions after scaling
    const outputWidth = Math.round(width * scaleFactor);
    const outputHeight = Math.round(height * scaleFactor);

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
     width="${outputWidth}" 
     height="${outputHeight}" 
     viewBox="0 0 ${outputWidth} ${outputHeight}">
  <image width="${outputWidth}" height="${outputHeight}" 
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
