#!/usr/bin/env node
/**
 * Fails when a change hand-edits the generated recipe data.
 *
 *   node scripts/check-generated-recipe-data.mjs <base-ref>
 *
 * Recipe metadata is authored in gleanwork/glean-cookbook at
 * recipes/<id>/recipe.json. This repo holds two derivatives:
 *
 *   data/cookbook-registry.json  a sync of that repo's built registry.json
 *   src/data/recipes.json        compiled from the sync by recipes:compile
 *
 * Both are committed, neither is gitignored, and JSON cannot carry a comment
 * saying so -- which is why four separate pull requests added recipes by editing
 * them directly. That looks completely correct: the build passes and the page
 * renders. The recipe then disappears on the next sync, because the sync writes
 * whatever upstream says and knows nothing about local additions.
 *
 * This check makes that failure immediate instead of a week later. It only fires
 * when the two files change without a matching lockstep regeneration, so a real
 * sync commit passes and a hand-edit does not.
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const REGISTRY = 'data/cookbook-registry.json';
const COMPILED = 'src/data/recipes.json';

const base = process.argv[2] ?? 'origin/main';

function changed(file) {
  try {
    const out = execFileSync(
      'git',
      ['diff', '--name-only', `${base}...HEAD`, '--', file],
      {
        encoding: 'utf8',
      },
    );
    return out.trim().length > 0;
  } catch {
    return false;
  }
}

if (!changed(REGISTRY) && !changed(COMPILED)) {
  console.log('Generated recipe data untouched — nothing to check.');
  process.exit(0);
}

// A legitimate change regenerates both from upstream, so the compiled file's
// recipe ids must match the sync's exactly. A hand-added recipe shows up in one
// or the other first, and an id present here but not upstream can only have been
// typed in by hand.
const repoRoot = path.resolve(import.meta.dirname, '..');
const registry = JSON.parse(
  fs.readFileSync(path.join(repoRoot, REGISTRY), 'utf8'),
);
const compiled = JSON.parse(
  fs.readFileSync(path.join(repoRoot, COMPILED), 'utf8'),
);

const registryIds = new Set(registry.map((entry) => entry.id));
const compiledIds = new Set(compiled.recipes.map((entry) => entry.id));

const onlyCompiled = [...compiledIds].filter((id) => !registryIds.has(id));
const onlyRegistry = [...registryIds].filter((id) => !compiledIds.has(id));

if (onlyCompiled.length === 0 && onlyRegistry.length === 0) {
  console.log(
    `Generated recipe data changed and is self-consistent (${registryIds.size} recipes).`,
  );
  process.exit(0);
}

console.error(`
${REGISTRY} and ${COMPILED} disagree, which means one of them was edited by hand.

  only in ${COMPILED}: ${onlyCompiled.join(', ') || '(none)'}
  only in ${REGISTRY}:  ${onlyRegistry.join(', ') || '(none)'}

Both files are GENERATED. To add or change a recipe:

  1. Author recipes/<id>/recipe.json in gleanwork/glean-cookbook and run
     \`npm run build:registry\` there. That repo is the source of truth.
  2. Here, run \`pnpm registry:sync\` then \`pnpm recipes:compile\`.
  3. Add the prose page at docs/cookbook/<id>.mdx. It carries no metadata
     frontmatter -- it is matched to its registry entry by filename.

Editing these two files directly appears to work: the build passes and the page
renders. The recipe is then deleted by the next sync, which writes whatever
upstream says.
`);
process.exit(1);
