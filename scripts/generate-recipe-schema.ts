import * as fs from 'node:fs';
import * as path from 'node:path';
import { z } from 'zod';
import { recipeMetaSchema } from '../src/types/recipe';

/**
 * Generates the developer-site adapter's schema projection. The canonical
 * contract is schemas/recipe.schema.json in gleanwork/glean-cookbook; this
 * projection must remain structurally identical so local Zod validation cannot
 * silently accept a different recipe shape.
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
    'Canonical validation contract for recipe records authored in gleanwork/glean-cookbook at recipes/<id>/recipe.json.',
  ...jsonSchema,
};

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, `${JSON.stringify(artifact, null, 2)}\n`);
console.log(`Wrote ${path.relative(repoRoot, outFile)}`);
