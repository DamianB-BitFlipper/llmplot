# AGENTS.md - LLM Plot CLI

This document provides guidelines for AI agents working on this codebase.

## Project Overview

`llmplot` is a CLI tool that generates beautiful LLM benchmark charts from YAML data.
Built with **Bun** and **TypeScript** - no Node.js APIs allowed.

## Build/Lint/Test Commands

```bash
# Install dependencies
bun install

# Run CLI directly (development)
bun run src/index.ts <input.yaml> -o <output.html>

# Run via npm script
bun dev -- <input.yaml> -o <output.html>

# Type checking
bun run typecheck

# Linting
bun run lint
bun run lint:fix    # auto-fix issues

# Build for distribution
bun run build
```

### Pre-commit Hooks

Husky runs `typecheck` and `lint` on every commit. Commits will fail if either check fails.

## Project Structure

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
website/                  # Astro static site
├── src/
│   ├── pages/
│   ├── components/
│   └── layouts/
└── package.json
```

## Code Style Guidelines

### Runtime: Bun Only

**CRITICAL**: Use Bun-native APIs exclusively. No Node.js APIs.

```typescript
// File operations
const file = Bun.file(path);
const content = await file.text();
const exists = await file.exists();
await Bun.write(path, content);

// Path resolution (use import.meta, not 'path' module)
const fullPath = new URL(`../${relativePath}`, import.meta.url).pathname;

// process.exit() is acceptable (Bun polyfills it)
```

### Imports

- Use `.js` extensions for local imports (ESM requirement)
- Use `type` keyword for type-only imports
- Order: external deps → local imports → types

```typescript
import { program } from "commander";
import { parseInputFile } from "./parser.js";
import type { InputConfig } from "./types.js";
```

### TypeScript

- Strict mode enabled (`strict: true` in tsconfig)
- Use explicit types for function parameters and returns
- Prefer interfaces over type aliases for objects
- Use `unknown` over `any`, then narrow with type guards

```typescript
// Good
function validate(data: unknown): InputConfig {
  if (typeof data !== "object" || data === null) {
    throw new ParseError("Invalid input");
  }
  const d = data as Record<string, unknown>;
  // ... validate fields
}

// Bad
function validate(data: any): InputConfig { ... }
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `my-module.ts` |
| Functions | camelCase | `parseInputFile()` |
| Classes | PascalCase | `ParseError` |
| Interfaces | PascalCase | `InputConfig` |
| Constants | camelCase | `defaultConfig` |
| Type params | Single uppercase | `T`, `K` |

### Error Handling

- Use custom error classes extending `Error`
- Set `this.name` in constructor for proper error identification
- Throw descriptive errors with context

```typescript
export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ParseError";
  }
}

// Usage
throw new ParseError(`models[${index}].positive must be a non-negative integer`);
```

### Async/Await

- Prefer `async/await` over `.then()` chains
- Use `Promise.all()` for parallel operations

```typescript
const rows = await Promise.all(
  models.map(async (m) => renderRow(m))
);
```

### String Formatting

- Use template literals for HTML generation
- Escape user content with `escapeHtml()` before embedding

```typescript
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
```

### CSS (Twind)

- Use Tailwind utility classes via Twind
- CSS is extracted and inlined at build time (no CDN)
- For dynamic values, use inline `style` attribute

```typescript
// Static styling: Tailwind classes
class="flex items-center gap-4 py-2"

// Dynamic styling: inline style
style="width: ${percentage}%; background-color: ${color};"
```

## Adding a New Provider

1. Add SVG icon to `assets/icons/{provider}.svg`
2. Run `bun run generate:assets` to regenerate `src/core/assets.ts`
3. Add entry to `providers` object in `src/core/providers.ts`

```typescript
// src/core/providers.ts
"new-provider": {
  color: "#HEX_COLOR",
},
```

## Input Format

YAML with required `title` and `models` array:

```yaml
title: "Benchmark Name"           # required
subtitle: "Description"           # optional
sponsoredBy: "Company"            # optional (footer)

models:
  - model: "provider/model-name"  # required, format: provider/name
    positive: 45                  # required, integer >= 0
    total: 50                     # required, integer > 0
```

## Output

Self-contained HTML with:
- Inlined CSS (extracted by Twind)
- Inlined SVG icons (read from assets/ at build time)
- No external dependencies required to view
