import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(import.meta.dirname, '..');
const legacyPath = '/cookbook/incident-copilot';
const canonicalPath = '/cookbook/oncall-copilot';

describe('cookbook recipe redirects', () => {
  it('publishes only the canonical generated recipe artifacts', () => {
    const registry = JSON.parse(
      fs.readFileSync(
        path.join(repoRoot, 'data', 'cookbook-registry.json'),
        'utf8',
      ),
    );
    const compiled = JSON.parse(
      fs.readFileSync(
        path.join(repoRoot, 'src', 'data', 'recipes.json'),
        'utf8',
      ),
    );

    expect(
      registry.some((recipe: { id: string }) => recipe.id === 'oncall-copilot'),
    ).toBe(true);
    expect(
      registry.some(
        (recipe: { id: string }) => recipe.id === 'incident-copilot',
      ),
    ).toBe(false);
    expect(
      compiled.recipes.find(
        (recipe: { id: string }) => recipe.id === 'oncall-copilot',
      )?.permalink,
    ).toBe(canonicalPath);
    expect(
      fs.existsSync(
        path.join(repoRoot, 'docs', 'cookbook', 'oncall-copilot.mdx'),
      ),
    ).toBe(true);
    expect(
      fs.existsSync(
        path.join(repoRoot, 'docs', 'cookbook', 'incident-copilot.mdx'),
      ),
    ).toBe(false);
    expect(
      fs.existsSync(
        path.join(
          repoRoot,
          'static',
          'img',
          'cookbook',
          'previews',
          'oncall-copilot',
          'preview.webp',
        ),
      ),
    ).toBe(true);
  });

  it('keeps the renamed on-call recipe canonical in Docusaurus and Vercel', () => {
    const clientRedirects = JSON.parse(
      fs.readFileSync(path.join(repoRoot, 'redirects.json'), 'utf8'),
    );
    const vercel = JSON.parse(
      fs.readFileSync(path.join(repoRoot, 'vercel.json'), 'utf8'),
    );

    expect(clientRedirects).toContainEqual({
      from: legacyPath,
      to: canonicalPath,
    });
    expect(vercel.redirects).toContainEqual({
      source: legacyPath,
      destination: canonicalPath,
      permanent: true,
    });
  });
});
