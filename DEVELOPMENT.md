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
| `bun run generate:assets` | Regenerate `src/core/assets.ts` from source files |
| `bun run generate:assets:watch` | Watch mode - regenerate assets on changes |

## Asset development

When modifying icons in `assets/icons/` or fonts in `assets/fonts/`, you need to regenerate `src/core/assets.ts`:

```bash
bun run generate:assets
```

For active development, run the asset watcher alongside the website dev server in **two terminals**:

**Terminal 1** - Watch assets and regenerate:
```bash
bun run generate:assets:watch
```

**Terminal 2** - Run website dev server:
```bash
cd website && bun dev
```

The asset watcher regenerates `src/core/assets.ts` when files in `assets/` change, and Vite will hot-reload automatically.

## Pre-commit hooks

Husky runs `typecheck` and `lint` before each commit. To skip (not recommended):

```bash
git commit --no-verify
```

## Project structure

```
src/
├── index.ts              # CLI entry point
├── core/                 # Pure core library (browser-compatible)
│   ├── index.ts          # Public API exports
│   ├── types.ts          # TypeScript interfaces
│   ├── providers.ts      # Provider colors & inline icons
│   ├── parser.ts         # YAML parsing & validation (no file I/O)
│   ├── renderer.ts       # HTML generation with Twind
│   └── assets.ts         # Bundled SVG icons & Geist font (auto-generated)
├── cli/                  # CLI-specific code (Bun runtime)
│   ├── index.ts          # Commander.js wrapper & file I/O
│   └── screenshot.ts     # Puppeteer PNG/SVG export
assets/
├── icons/                # SVG icons per provider (source files)
└── fonts/                # Geist font (source file)
website/                  # Astro static site (uses core library)
```

## Website development

```bash
cd website
bun install
bun dev
```
