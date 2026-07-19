import * as fs from 'node:fs';
import * as path from 'node:path';
import yaml from 'js-yaml';
import { parseRecipeFrontmatter } from '../src/types/recipe';
import { RECIPE_SURFACES } from '../src/types/recipe';
import type { RecipeRecord, RecipesData } from '../src/types/recipe';

/**
 * Compiles cookbook recipes into src/data/recipes.json.
 *
 * Reads every .mdx file in docs/cookbook/ (except index.mdx), validates the
 * frontmatter `recipe:` block against the schema in src/types/recipe.ts, and
 * emits the flat records consumed by the Cookbook components and the
 * glean-cookbook plugin.
 *
 * Validation failures FAIL THE BUILD (exit 1) — lax registries rot.
 *
 * Wired into Turbo as //#recipes:compile (a dependsOn of //#docusaurus:build),
 * mirroring //#changelog:aggregate. Run directly via `pnpm recipes:compile`.
 */

const repoRoot = path.resolve(import.meta.dirname, '..');
const recipesDir = path.join(repoRoot, 'docs', 'cookbook');
const outputFile = path.join(repoRoot, 'src', 'data', 'recipes.json');

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;

function extractFrontmatter(source: string, fileName: string): unknown {
  const match = source.match(FRONTMATTER_RE);
  if (!match) {
    throw new Error(`${fileName}: no frontmatter block found`);
  }
  return yaml.load(match[1]);
}

function main(): void {
  const records: RecipeRecord[] = [];
  const errors: string[] = [];

  const files = fs.existsSync(recipesDir)
    ? fs
        .readdirSync(recipesDir)
        .filter((file) => file.endsWith('.mdx') && file !== 'index.mdx')
        .sort()
    : [];

  for (const fileName of files) {
    const filePath = path.join(recipesDir, fileName);
    const expectedId = path.basename(fileName, '.mdx');

    let frontmatter: unknown;
    try {
      frontmatter = extractFrontmatter(
        fs.readFileSync(filePath, 'utf-8'),
        fileName,
      );
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
      continue;
    }

    const result = parseRecipeFrontmatter(frontmatter, expectedId);
    if (!result.success) {
      errors.push(...result.errors.map((e) => `${fileName}: ${e}`));
      continue;
    }
    records.push(result.record);
  }

  const duplicates = records
    .map((r) => r.id)
    .filter((id, i, ids) => ids.indexOf(id) !== i);
  if (duplicates.length > 0) {
    errors.push(`duplicate recipe ids: ${[...new Set(duplicates)].join(', ')}`);
  }

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
    .map((r) => r.last_verified)
    .filter((d): d is string => Boolean(d))
    .sort()
    .at(-1);

  // Facet chips follow the design's deliberate order (the schema enum
  // order), not alphabetical.
  const enumOrder = (order: readonly string[]) => (a: string, b: string) =>
    order.indexOf(a) - order.indexOf(b);

  const data: RecipesData = {
    recipes: records,
    surfaces: [...new Set(records.flatMap((r) => r.surfaces))].sort(
      enumOrder(RECIPE_SURFACES),
    ),
    generatedAt: latestVerified
      ? new Date(`${latestVerified}T00:00:00.000Z`).toISOString()
      : new Date(0).toISOString(),
    totalRecipes: records.length,
  };

  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, `${JSON.stringify(data, null, 2)}\n`);
  console.log(
    `Generated recipes data with ${records.length} recipe(s) from ${files.length} file(s)`,
  );
}

main();
