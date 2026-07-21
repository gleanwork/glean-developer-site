/**
 * Regenerates the Web SDK reference (docs/libraries/web-sdk/reference)
 * from the installed @gleanwork/web-sdk type definitions.
 *
 * Mirrors the OpenAPI pattern: generated docs are committed, and this
 * script re-runs when the dependency is bumped. Post-processing strips
 * TypeDoc's "Interface: " / "Variable: " h1 prefixes (they'd leak into
 * sidebar labels) and adds _category_.json files for the sidebar.
 */
import { execSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT = 'docs/libraries/web-sdk/reference';

execSync('pnpm exec typedoc', { stdio: 'inherit' });

// Strip kind prefixes from page titles.
function cleanTitles(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      cleanTitles(path);
      continue;
    }
    if (!entry.name.endsWith('.md')) {
      continue;
    }
    const source = readFileSync(path, 'utf8');
    const cleaned = source.replace(
      /^# (?:Interface|Variable|Type Alias|Class|Function|Enumeration): /m,
      '# ',
    );
    if (cleaned !== source) {
      writeFileSync(path, cleaned);
    }
  }
}
cleanTitles(OUT);

// The index page leads the sidebar category.
const indexPath = join(OUT, 'index.md');
writeFileSync(
  indexPath,
  `---\nsidebar_label: Overview\nsidebar_position: 1\n---\n\n${readFileSync(indexPath, 'utf8')}`,
);

// Sidebar category labels + ordering.
const categories = {
  interfaces: { label: 'Interfaces', position: 2 },
  'type-aliases': { label: 'Type Aliases', position: 3 },
  variables: { label: 'Exports', position: 4 },
};
for (const [dir, config] of Object.entries(categories)) {
  writeFileSync(
    join(OUT, dir, '_category_.json'),
    `${JSON.stringify(config, null, 2)}\n`,
  );
}

console.log('Web SDK reference regenerated.');
