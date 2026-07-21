# AGENTS Instructions

This repository contains a Docusaurus website built with Node.js and pnpm.

## Environment

Versions of tools are handled transparently by mise. No need to manage tool versions explicitly.

Use `pnpm install` to install dependencies locally.

## Programmatic Checks

AVOID RUNNING `pnpm start` - this causes very slow build times, and will interupt the agent workflow.

- Run `pnpm build` to ensure the site builds successfully.
- Formatting is handled by Prettier. Run `pnpm format` to apply the project's style (single quotes and trailing commas).
- Test with `pnpm test`.  This will execute `vitest run`.  Always execute in run mode (using `pnpm test`) to avoid getting stuck.

## Content Guidelines

- Prefer built-in Docusaurus components when creating pages or examples.
  Custom React components should only be added when a built-in component
  cannot achieve the desired result.
- Prefer default styles rather than creating new ones. Leverage existing CSS classes first, either from infima or via custom defined classes
- Avoid inline CSS styles

## Web SDK reference (generated)

`docs/libraries/web-sdk/reference/` is generated from the installed
`@gleanwork/web-sdk` type definitions — do not edit those pages by hand.
When the `@gleanwork/web-sdk` dependency is bumped, run
`pnpm websdk:reference:generate` and commit the regenerated pages in the
same PR (mirrors the OpenAPI pattern). Config lives in `typedoc.json`;
post-processing in `scripts/websdk-reference-generate.mjs`.

## Code samples (markdown-code)

Code fences in `docs/**/*.mdx` that carry a `snippet=<path>` annotation are
managed by [markdown-code](https://github.com/scalvert/markdown-code): the
source of truth is the referenced file under `snippets/`, and CI runs
`pnpm snippets:check` to block drift.

- To change a managed sample, edit the file under `snippets/` and run
  `pnpm snippets:sync` to update the fence. Never edit the fence body
  directly — check will fail.
- New code fences you author are unmanaged until extracted; run
  `npx md-code extract` to bring them under management (extraction only
  inserts the `snippet=` annotation; it never rewrites other content).
- Config lives in `.markdown-coderc.json`. `docs/api/**` (generated) and
  `docs/api-info/indexing/documents/permissions.mdx` (uses Docusaurus-only
  `{#heading-id}` syntax that MDX can't parse) are excluded.
- Every sample must still be verified against released SDK/API versions
  before it goes into a snippet file — markdown-code prevents drift between
  fence and file, not incorrect code.

## Task-specific skills

Project-local Claude Code skills live under `.claude/skills/`. Load the relevant skill when its scenario triggers:

- **`.claude/skills/fix-broken-links/SKILL.md`** — Use when investigating a `Broken Links Detected` issue or a failing `Link Checker` workflow run. The nightly link checker emits a `link-check-fixme.md` artifact designed to be handed directly to an agent; the skill describes the project conventions for triaging the failures, where exclusions belong, and how to verify a fix.

## Cookbook recipes

Recipes live in `docs/cookbook/*.mdx` — one file per recipe. The frontmatter
`recipe:` block is the machine-readable schema record (validated by
`src/types/recipe.ts`; JSON Schema artifact at `schemas/recipe.schema.json`);
the MDX body is the prose. `pnpm recipes:compile` validates every recipe and
emits `src/data/recipes.json`, which drives the `/cookbook` index, the recipe
right rail, and the homepage band. Validation failures fail the build.

To add a recipe:

1. Create `docs/cookbook/<id>.mdx`. The filename must equal `recipe.id`
   (kebab-case). Copy the frontmatter shape from
   `docs/cookbook/embed-search-chat.mdx`.
2. Set page `title`/`description` — they double as the recipe's title and
   summary. Put everything else in the `recipe:` block (personas, surfaces,
   status, levels, time_estimate, required_scopes, prerequisites,
   demo_queries, code_assets, scaffold_actions, ai_prompt, llm_context, tags).
3. Wrap the body in `<RecipePage recipeId="<id>">` and use the standard
   sections: Problem, Architecture (mermaid), Prerequisites, Steps
   (`<Steps>`/`<Step>`), Extensions (wow).
4. Only document verified APIs — source code samples from the published
   guides (e.g. `docs/libraries/web-sdk/`), never from memory. Scope names,
   endpoints, and function names must exist in the docs.
5. `featured: true` surfaces the recipe on the homepage band (max 3 shown);
   a `flagship` tag renders the flagship card treatment.
6. Verify with `pnpm recipes:compile`, `pnpm test`, and `pnpm build`
   (the Cookbooks nav/band are gated behind the `cookbook` feature flag —
   build with `FF_COOKBOOKS=true` to see them).
