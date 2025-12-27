#!/usr/bin/env bun

import { program } from "commander";
import { parseInputFile, ParseError } from "./parser.js";
import { renderHtml } from "./renderer.js";
import { renderToImage, getExportFormat } from "./screenshot.js";

program
  .name("llmplot")
  .description("Generate beautiful LLM benchmark charts from YAML data")
  .version("0.1.0")
  .argument("<input>", "Input YAML file path")
  .requiredOption("-o, --output <path>", "Output file path (.html, .png, or .svg)")
  .option("-W, --width <pixels>", "Image width in pixels (default: 1080 for 4:5 aspect ratio)")
  .option("-H, --height <pixels>", "Image height in pixels (default: 4:5 aspect ratio based on width)")
  .action(async (input: string, options: { output: string; width?: string; height?: string }) => {
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
        // Parse dimensions if provided
        const width = options.width ? parseInt(options.width, 10) : undefined;
        const height = options.height ? parseInt(options.height, 10) : undefined;

        // Export as image (PNG or SVG)
        await renderToImage(html, outputPath, imageFormat, { width, height });
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
