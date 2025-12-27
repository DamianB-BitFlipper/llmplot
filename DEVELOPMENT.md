# Development

## Setup

```bash
bun install
```

## Run locally

```bash
# Run directly
bun run src/index.ts data.yaml -o output.html

# Or use the dev script
bun dev -- data.yaml -o output.html
```

## Link globally (editable install)

```bash
bun link
```

Now you can run `llmplot` from anywhere. Changes to source files take effect immediately.

## Scripts

| Command | Description |
|---------|-------------|
| `bun dev -- <args>` | Run CLI in development |
| `bun run typecheck` | TypeScript type checking |
| `bun run lint` | ESLint |
| `bun run lint:fix` | ESLint with auto-fix |
| `bun run build` | Build for distribution |

## Pre-commit hooks

Husky runs `typecheck` and `lint` before each commit. To skip (not recommended):

```bash
git commit --no-verify
```

## Project structure

```
src/
├── index.ts      # CLI entry point
├── types.ts      # TypeScript interfaces
├── parser.ts     # YAML parsing & validation
├── renderer.ts   # HTML generation
└── providers.ts  # Provider colors (edit to customize)
```
