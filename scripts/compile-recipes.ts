import * as fs from 'node:fs';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';
import { isListedOnDocs, parseRecipeEntry } from '../src/types/recipe';
import { RECIPE_SURFACES } from '../src/types/recipe';
import type {
  CookbookPlugin,
  RecipeRecord,
  RecipesData,
} from '../src/types/recipe';

/**
 * Compiles cookbook recipes into src/data/recipes.json.
 *
 * Reads data/cookbook-registry.json (the local snapshot of glean-cookbook's
 * registry.json — see `pnpm registry:sync`), validates each entry against
 * the schema in src/types/recipe.ts, and cross-checks that every listed
 * entry has a matching prose page at docs/cookbook/{id}.mdx and vice versa.
 * Hidden recipes stay in the snapshot and must not have an MDX page. Emits
 * the listed records consumed by the Cookbook components.
 *
 * Validation failures FAIL THE BUILD (exit 1) — lax registries rot.
 *
 * Wired into Turbo as //#recipes:compile (a dependsOn of //#docusaurus:build),
 * mirroring //#changelog:aggregate. Run directly via `pnpm recipes:compile`.
 */

const repoRoot = path.resolve(import.meta.dirname, '..');
const registryFile = path.join(repoRoot, 'data', 'cookbook-registry.json');
const pluginFile = path.join(repoRoot, 'data', 'cookbook-plugin.json');
const recipesDir = path.join(repoRoot, 'docs', 'cookbook');
const outputFile = path.join(repoRoot, 'src', 'data', 'recipes.json');

export function compileRecipeCatalog(
  registry: unknown[],
  pageIds: Set<string>,
): { records: RecipeRecord[]; errors: string[] } {
  const records: RecipeRecord[] = [];
  const errors: string[] = [];
  const remainingPages = new Set(pageIds);

  for (const entry of registry) {
    const expectedId =
      entry !== null && typeof entry === 'object' && 'id' in entry
        ? String((entry as { id: unknown }).id)
        : undefined;

    const result = parseRecipeEntry(entry, expectedId);
    if (!result.success) {
      errors.push(...result.errors.map((e) => `${expectedId ?? '?'}: ${e}`));
      continue;
    }

    if (!isListedOnDocs(result.record)) {
      if (remainingPages.has(result.record.id)) {
        errors.push(
          `${result.record.id}: hidden recipe must not have docs/cookbook/${result.record.id}.mdx`,
        );
        remainingPages.delete(result.record.id);
      }
      continue;
    }

    const missingWalkthroughCode =
      result.record.codeWalkthrough?.examples.filter(
        (example) => !example.code,
      ) ?? [];
    if (missingWalkthroughCode.length > 0) {
      errors.push(
        `${result.record.id}: code walkthrough source was not materialized for ${missingWalkthroughCode
          .map((example) => example.source)
          .join(', ')}`,
      );
      continue;
    }

    if (!remainingPages.has(result.record.id)) {
      errors.push(
        `${result.record.id}: registry entry has no matching docs/cookbook/${result.record.id}.mdx page`,
      );
      continue;
    }
    remainingPages.delete(result.record.id);

    records.push(result.record);
  }

  for (const orphanId of remainingPages) {
    errors.push(
      `${orphanId}: docs/cookbook/${orphanId}.mdx has no matching registry entry`,
    );
  }

  const duplicates = records
    .map((r) => r.id)
    .filter((id, i, ids) => ids.indexOf(id) !== i);
  if (duplicates.length > 0) {
    errors.push(`duplicate recipe ids: ${[...new Set(duplicates)].join(', ')}`);
  }

  return { records, errors };
}

function main(): void {
  if (!fs.existsSync(registryFile)) {
    console.error(
      `Recipe registry not found at ${path.relative(repoRoot, registryFile)}. Run \`pnpm registry:sync\` first.`,
    );
    process.exit(1);
  }
  const registry: unknown = JSON.parse(fs.readFileSync(registryFile, 'utf8'));
  if (!Array.isArray(registry)) {
    console.error(
      `${path.relative(repoRoot, registryFile)} must be a JSON array of recipe entries.`,
    );
    process.exit(1);
  }

  // Plugin coordinates come from glean-cookbook's generated marketplace
  // manifest (see scripts/sync-registry.mjs). Required, not optional: recipe
  // pages print these in install/invocation commands, and a page that silently
  // rendered without them would show a broken command rather than nothing.
  if (!fs.existsSync(pluginFile)) {
    console.error(
      `Plugin coordinates not found at ${path.relative(repoRoot, pluginFile)}. Run \`pnpm registry:sync\` first.`,
    );
    process.exit(1);
  }
  const plugin = JSON.parse(
    fs.readFileSync(pluginFile, 'utf8'),
  ) as CookbookPlugin;
  for (const field of ['marketplaceName', 'pluginName', 'repo'] as const) {
    if (!plugin[field]) {
      console.error(
        `${path.relative(repoRoot, pluginFile)} is missing "${field}".`,
      );
      process.exit(1);
    }
  }

  const pageIds = new Set(
    fs.existsSync(recipesDir)
      ? fs
          .readdirSync(recipesDir)
          .filter((file) => file.endsWith('.mdx') && file !== 'index.mdx')
          .map((file) => path.basename(file, '.mdx'))
      : [],
  );

  const { records, errors } = compileRecipeCatalog(registry, pageIds);

  if (errors.length > 0) {
    console.error(`Recipe validation failed (${errors.length} error(s)):`);
    for (const error of errors) {
      console.error(`  - ${error}`);
    }
    process.exit(1);
  }

  // generatedAt mirrors the changelog convention (derived from content, not
  // wall-clock) so the committed artifact stays deterministic for Turbo.
  const latestVerified = records
    .map((r) => r.lastVerified)
    .filter((d): d is string => Boolean(d))
    .sort()
    .at(-1);

  // Facet chips follow the design's deliberate order (the schema enum
  // order), not alphabetical.
  const enumOrder = (order: readonly string[]) => (a: string, b: string) =>
    order.indexOf(a) - order.indexOf(b);

  const data: RecipesData = {
    // First key in the emitted file, so anyone who opens it sees this before the
    // data. The registry snapshot is a bare array and cannot carry the same
    // marker, which is why data/README.md exists.
    _generated:
      'Generated by `pnpm recipes:compile` from data/cookbook-registry.json. Do not edit. Recipe metadata is authored in gleanwork/glean-cookbook at recipes/<id>/recipe.json — see AGENTS.md.',
    recipes: records,
    surfaces: [...new Set(records.flatMap((r) => r.surfaces))].sort(
      enumOrder(RECIPE_SURFACES),
    ),
    generatedAt: latestVerified
      ? new Date(`${latestVerified}T00:00:00.000Z`).toISOString()
      : new Date(0).toISOString(),
    totalRecipes: records.length,
    plugin,
  };

  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, `${JSON.stringify(data, null, 2)}\n`);
  console.log(
    `Generated recipes data with ${records.length} recipe(s) from ${registry.length} registry entries`,
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main();
}
