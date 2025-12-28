#!/usr/bin/env bun

import { program } from "commander";
import { parseInputFile, ParseError } from "./parser.js";
import { renderHtml, calculateLayoutDimensions, PADDING_OUTER, TARGET_OUTPUT_WIDTH } from "./renderer.js";
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
        // Calculate layout dimensions based on content
        const showRankings = config.showRankings ?? false;
        const { cardWidth, cardHeight } = calculateLayoutDimensions(
          models.length,
          !!config.subtitle,
          !!config.sponsoredBy,
          showRankings
        );
        
        // Viewport = card + outer padding on each side
        const viewportWidth = cardWidth + (PADDING_OUTER * 2);
        const viewportHeight = cardHeight + (PADDING_OUTER * 2);
        
        // Calculate scale factor to achieve target output width
        const scaleFactor = TARGET_OUTPUT_WIDTH / viewportWidth;
        
        // Export as image (PNG or SVG) scaled to target width
        await renderToImage(html, outputPath, imageFormat, {
          width: viewportWidth,
          height: viewportHeight,
          scaleFactor
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
