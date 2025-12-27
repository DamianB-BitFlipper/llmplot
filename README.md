# llmplot

Generate benchmark charts for LLM model comparisons.

## Install

```bash
bun install
```

## Usage

```bash
bun run src/index.ts <input.yaml> -o <output.html>
```

### Example

```bash
bun run src/index.ts example.yaml -o results.html
```

## Input Format

Create a YAML file with your benchmark data:

```yaml
title: "My Benchmark"
subtitle: "Optional description"        # optional
sponsoredBy: "Company Name"             # optional, shown in footer
orientation: horizontal                 # optional, horizontal (default) or vertical

models:
  - model: "anthropic/claude-opus-4.5"
    positive: 19
    total: 20

  - model: "openai/gpt-5.2-codex-max"
    positive: 18
    total: 20
```

Models are automatically sorted by score (best first).

## Adding Provider Colors

Edit `src/providers.ts` to customize colors for each provider.

## Adding Provider Icons

Add SVG files to `assets/icons/` named `{provider}.svg` (e.g., `anthropic.svg`).
