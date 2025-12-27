#!/usr/bin/env bun

import { program } from "commander";
import { parseInputFile, ParseError } from "./parser.js";
import { renderHtml } from "./renderer.js";

program
  .name("llmplot")
  .description("Generate beautiful LLM benchmark charts from YAML data")
  .version("0.1.0")
  .argument("<input>", "Input YAML file path")
  .requiredOption("-o, --output <path>", "Output file path (must be .html)")
  .action(async (input: string, options: { output: string }) => {
    try {
      // Validate output extension
      if (!options.output.endsWith(".html")) {
        console.error("Error: Output file must have .html extension");
        console.error("(SVG and PNG export coming soon)");
        process.exit(1);
      }

      // Parse input file
      const { config, models } = await parseInputFile(input);

      // Render HTML
      const html = renderHtml(config, models);

      // Write output file
      await Bun.write(options.output, html);

      console.log(`✓ Generated ${options.output}`);
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
