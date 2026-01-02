/**
 * CLI entry point for llmplot.
 * Thin wrapper around core library with file I/O.
 */

import { program } from "commander";
import { dirname } from "path";
import {
  processModels,
  renderChart,
  calculateLayoutDimensions,
} from "../core/index.js";
import { parseYaml, ParseError } from "./parser.js";
import { renderToImage, getExportFormat } from "./screenshot.js";

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
    const basePath = dirname(inputPath);
    const config = await parseYaml(yamlContent, basePath);
    const models = processModels(config);

    // Render HTML (CLI mode with full document, embedded CSS/fonts)
    const html = renderChart(config, models, { mode: 'cli' });

    // Determine output path and format
    const outputPath = options.output ?? inputPath.replace(/\.ya?ml$/i, ".html");
    const exportFormat = getExportFormat(outputPath);

    if (exportFormat) {
      // PNG or SVG export via Puppeteer
      const dimensions = calculateLayoutDimensions(
        models.length,
        !!config.description,
        config.showRankings
      );

      await renderToImage(html, outputPath, exportFormat, {
        width: dimensions.backgroundWidth,
        height: dimensions.backgroundHeight,
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
