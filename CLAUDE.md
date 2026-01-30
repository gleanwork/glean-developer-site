# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
pnpm install

# Build (validates site, catches broken links)
pnpm build

# Run tests (vitest in run mode)
pnpm test

# Format code (Prettier with single quotes, trailing commas)
pnpm format

# Check links on production
pnpm links:check

# Regenerate OpenAPI docs from specs
pnpm openapi:regenerate:all

# Create a new changelog entry
pnpm changelog:entry:new
```

**Do not run `pnpm start`** - it causes slow builds and interrupts agent workflows. Use `pnpm build` to validate changes.

## Indexing Scripts

The `scripts/indexing/` directory contains a Python-based Glean indexing pipeline. Use mise tasks from the repo root:

```bash
mise run indexing:dry-run    # Test extraction without uploading
mise run indexing:run        # Full indexing (requires GLEAN_INDEXING_API_TOKEN, GLEAN_INSTANCE)
mise run indexing:setup      # Install deps and Playwright browsers
```

## Architecture

This is a Docusaurus 3 site with automatic OpenAPI documentation generation.

### Build Pipeline (Turbo)

The build is orchestrated by Turbo with these key dependencies:

1. **OpenAPI Transform** → Downloads specs from `gleanwork/open-api`, capitalizes language names, splits Client API into per-tag files to break circular refs
2. **OpenAPI Generate** → Generates MDX docs from transformed specs using `docusaurus-plugin-openapi-docs`
3. **Changelog Compile** → Generates `src/data/changelog.json` and RSS from `changelog/entries/*.md`
4. **Docusaurus Build** → Final site build (depends on all above)

### OpenAPI Docs Generation

- Source specs: Remote from `gleanwork/open-api` repo
- Transform scripts: `scripts/openapi-*.mjs`
- Custom markdown generator: `scripts/generator/customMdGenerators.ts`
- Output: `docs/api/client-api/` and `docs/api/indexing-api/`

### Packages

- `packages/changelog-generator/` - CLI for changelog management (compile, preview, publish)

### Glean Indexing Pipeline

- `scripts/indexing/` - Indexes developer docs into Glean for search
- Uses `glean-indexing-sdk` with custom connector
- Extracts info pages (trafilatura) and API reference pages (Playwright for dynamic content)
- Two object types: `infoPage` and `apiReference`

## Content Guidelines

- Prefer built-in Docusaurus components over custom React components
- Use existing CSS classes (infima or custom) rather than creating new ones
- Avoid inline CSS styles
