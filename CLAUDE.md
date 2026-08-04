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
mise run indexing:run        # Full indexing (requires GLEAN_INDEXING_API_TOKEN, GLEAN_SERVER_URL)
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

## MCP Server Policy

**We promote the remote MCP server exclusively. Never reference or recommend `@gleanwork/mcp-server` (the local npm package) — it is old and deprecated in favour of the remote server. All MCP documentation, examples, and guidance must direct users to the remote MCP server and the MCP Configurator at `/guides/mcp`.**

**Authentication: The primary auth mechanism for the remote MCP server is OAuth. Do not tell users they need an API token — that is one option but not the default or recommended path.**

## Content Guidelines

- Prefer built-in Docusaurus components over custom React components
- Use existing CSS classes (infima or custom) rather than creating new ones
- Avoid inline CSS styles
- Do not invent or fabricate content (tool names, API details, code examples, steps) — only document what is verified and accurate

## Cookbook recipes

Recipe metadata is **authored in `gleanwork/glean-cookbook`**, one file per recipe
at `recipes/<id>/recipe.json`. That repo is the source of truth.

Two files here are generated from it and must never be hand-edited:

- `data/cookbook-registry.json` — a sync of the cookbook's built `registry.json`
- `src/data/recipes.json` — compiled from that sync by `pnpm recipes:compile`

Both are committed and neither is gitignored, so they look editable, and a recipe
added to them renders correctly. It is then deleted by the next sync, which writes
whatever upstream says. `scripts/check-generated-recipe-data.mjs` fails CI when the
two disagree.

To add a recipe:

1. In `glean-cookbook`: add `recipes/<id>/recipe.json`, run `npm run build:registry`.
2. Here: `pnpm registry:sync`, then `pnpm recipes:compile`.
3. Add the prose page at `docs/cookbook/<id>.mdx`. It carries **no metadata
   frontmatter** — it is matched to its registry entry by filename, and its title,
   description and demo queries all come from the registry.
