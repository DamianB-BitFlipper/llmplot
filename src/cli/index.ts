/**
 * CLI entry point for llmplot.
 * Thin wrapper around core library with file I/O.
 */

import { program } from "commander";
import {
  parseYaml,
  processModels,
  renderChart,
  calculateLayoutDimensions,
  PADDING_OUTER,
  ParseError,
} from "../core/index.js";
import { renderToImage, getExportFormat } from "./screenshot.js";
import type { ExportFormat } from "./screenshot.js";

async function main(): Promise<void> {
  program
    .name("llmplot")
    .description("Generate beautiful LLM benchmark charts from YAML data")
    .argument("<input>", "Input YAML file")
    .option("-o, --output <path>", "Output file path (html, png, or svg)")
    .parse(process.argv);

  const inputPath = program.args[0];
  const options = program.opts<{ output?: string }>();

  try {
    // Read and parse YAML file
    const file = Bun.file(inputPath);
    if (!(await file.exists())) {
      console.error(`Error: File not found: ${inputPath}`);
      process.exit(1);
    }

    const yamlContent = await file.text();
    const config = parseYaml(yamlContent);
    const models = processModels(config);

    // Render HTML (standalone mode with embedded CSS/fonts)
    const html = renderChart(config, models, { standalone: true });

    // Determine output path and format
    const outputPath = options.output ?? inputPath.replace(/\.ya?ml$/i, ".html");
    const exportFormat = getExportFormat(outputPath);

    if (exportFormat) {
      // PNG or SVG export via Puppeteer
      const dimensions = calculateLayoutDimensions(
        models.length,
        !!config.subtitle,
        !!config.sponsoredBy,
        config.showRankings ?? false
      );

      await renderToImage(html, outputPath, exportFormat, {
        width: dimensions.cardWidth + PADDING_OUTER * 2,
        height: dimensions.cardHeight + PADDING_OUTER * 2,
        scaleFactor: 2,
      });

      console.log(`Generated ${exportFormat.toUpperCase()}: ${outputPath}`);
    } else {
      // HTML output
      await Bun.write(outputPath, html);
      console.log(`Generated HTML: ${outputPath}`);
    }
  } catch (error) {
    if (error instanceof ParseError) {
      console.error(`Parse error: ${error.message}`);
      process.exit(1);
    }
    throw error;
  }
}

main();

// Re-export for programmatic CLI use
export { renderToImage, getExportFormat };
export type { ExportFormat };
