import * as fs from 'node:fs';
import * as path from 'node:path';
import { z } from 'zod';
import { recipeMetaSchema } from '../src/types/recipe';

/**
 * Generates schemas/recipe.schema.json from the zod schema in
 * src/types/recipe.ts. The zod schema is the source of truth; the JSON
 * Schema artifact exists for external consumers (the glean-cookbook
 * plugin, the cookbook repo CI, editors).
 *
 * Run via `pnpm recipes:schema`.
 */

const repoRoot = path.resolve(import.meta.dirname, '..');
const outFile = path.join(repoRoot, 'schemas', 'recipe.schema.json');

const jsonSchema = z.toJSONSchema(recipeMetaSchema, { io: 'input' });

const artifact = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://developers.glean.com/schemas/recipe.schema.json',
  title: 'Glean Cookbook Recipe',
  description:
    'The `recipe` frontmatter block of a cookbook recipe MDX file. Generated from src/types/recipe.ts — do not edit by hand.',
  ...jsonSchema,
};

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, `${JSON.stringify(artifact, null, 2)}\n`);
console.log(`Wrote ${path.relative(repoRoot, outFile)}`);
