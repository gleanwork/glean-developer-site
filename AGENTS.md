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

**Recipe metadata is not in this repo.** It is authored in
[`gleanwork/glean-cookbook`](https://github.com/gleanwork/glean-cookbook), one file
per recipe at `recipes/<id>/recipe.json`. That repo is the source of truth, and it
also holds the runnable code each recipe scaffolds.

This repo holds the prose page and two generated derivatives:

| path | what it is |
| --- | --- |
| `docs/cookbook/<id>.mdx` | the prose page. **No metadata frontmatter** — matched to its registry entry by filename |
| `data/cookbook-registry.json` | **generated** — a sync of the cookbook's built `registry.json` |
| `src/data/recipes.json` | **generated** — compiled from that sync by `pnpm recipes:compile` |

Do not edit the two generated files. They are committed and not gitignored, so they
look editable, and a recipe added to them renders correctly — then disappears on the
next sync, which writes whatever upstream says. Four pull requests did this before
`scripts/check-generated-recipe-data.mjs` existed to fail CI on it.

To add a recipe:

1. **In `glean-cookbook`:** add `recipes/<id>/recipe.json` (schema:
   `schemas/recipe.schema.json`, generated from this repo's `src/types/recipe.ts` —
   field names are camelCase), add the runnable code under `recipes/<id>/`, then
   `npm run build:registry` and `npm run validate:registry`.
2. **Here:** `pnpm registry:sync`, then `pnpm recipes:compile`.
3. **Here:** add `docs/cookbook/<id>.mdx`. Wrap the body in
   `<RecipePage recipeId="<id>">` and use the standard sections — `RecipeSection`
   (Problem), `RecipeArchitecture`, `RecipePrereqs`, `RecipeSteps`,
   `RecipeDemoQueries`, `TakeItFurther`. Copy the shape from
   `docs/cookbook/embed-search-chat.mdx`. Title, description, prerequisites, steps
   and demo queries all render from the registry, so do not restate them in prose.
4. Verify with `pnpm recipes:compile`, `pnpm test`, and `pnpm build`. The Cookbooks
   nav and homepage band are behind the `cookbook` feature flag — build with
   `FF_COOKBOOKS=true` to see them.

Only document verified APIs. Source samples from the published guides (e.g.
`docs/libraries/web-sdk/`), never from memory: scope names, endpoints and function
names must exist in the docs. A recipe's `demoQueries` are the eval data its
verification harness runs, so they must be answerable on a reader's own instance —
never against a seeded demo corpus.

