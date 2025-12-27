#!/usr/bin/env bun

import { program } from "commander";
import { parseInputFile, ParseError } from "./parser.js";
import { renderHtml, calculateLayoutDimensions } from "./renderer.js";
import { renderToImage, getExportFormat } from "./screenshot.js";

program
  .name("llmplot")
  .description("Generate beautiful LLM benchmark charts from YAML data")
  .version("0.1.0")
  .argument("<input>", "Input YAML file path")
  .requiredOption("-o, --output <path>", "Output file path (.html, .png, or .svg)")
  .action(async (input: string, options: { output: string }) => {
    try {
      const outputPath = options.output;
      const imageFormat = getExportFormat(outputPath);
      const isHtml = outputPath.toLowerCase().endsWith(".html");

      // Validate output extension
      if (!isHtml && !imageFormat) {
        console.error("Error: Output file must have .html, .png, or .svg extension");
        process.exit(1);
      }

      // Parse input file
      const { config, models } = await parseInputFile(input);

      // Render HTML
      const html = await renderHtml(config, models);

      if (imageFormat) {
        // Calculate viewport dimensions based on content for 4:5 aspect ratio
        const layoutDims = calculateLayoutDimensions(
          models.length,
          !!config.subtitle,
          !!config.sponsoredBy,
          config.showRankings ?? false
        );

        // Export as image (PNG or SVG)
        await renderToImage(html, outputPath, imageFormat, {
          width: Math.round(layoutDims.viewportWidth),
          height: Math.round(layoutDims.viewportHeight)
        });
      } else {
        // Write HTML output
        await Bun.write(outputPath, html);
      }

      console.log(`✓ Generated ${outputPath}`);
    } catch (error) {
      if (error instanceof ParseError) {
        console.error(`Error: ${error.message}`);
      } else {
        console.error(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
      }
      process.exit(1);
    }
  });

program.parse();
