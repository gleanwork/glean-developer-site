import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(import.meta.dirname, '..');
const manifestPath = path.join(
  repoRoot,
  'data',
  'legacy-guide-migrations.json',
);

type MigrationStatus = 'pending' | 'completed';
type Disposition = 'retain' | 'update' | 'convert' | 'retire';

type MigrationEntry = {
  id: string;
  source: string;
  currentSource: string | null;
  route: string;
  routeType: 'page' | 'imported-fragment';
  sidebar: boolean;
  disposition: Disposition;
  destination: string;
  destinationKind: string;
  destinationReady: boolean;
  status: MigrationStatus;
  aliases: string[];
};

type MigrationManifest = {
  schemaVersion: number;
  baseline: {
    developerSiteCommit: string;
    sourceRoots: string[];
    sourceCount: number;
  };
  redirectPolicy: {
    canonicalStores: string[];
    aliasStore: string;
    directOnly: boolean;
  };
  entries: MigrationEntry[];
};

type ClientRedirect = { from: string; to: string };
type VercelRedirect = {
  source: string;
  destination: string;
  permanent: boolean;
};

const readJson = <T>(relativePath: string): T =>
  JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8')) as T;

const manifest = readJson<MigrationManifest>(
  'data/legacy-guide-migrations.json',
);
const clientRedirects = readJson<ClientRedirect[]>('redirects.json');
const permalinks = readJson<ClientRedirect[]>('permalinks.json');
const vercel = readJson<{ redirects?: VercelRedirect[] }>('vercel.json');
const sidebar = fs.readFileSync(path.join(repoRoot, 'sidebars.ts'), 'utf8');

function walk(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

function sourceDirectory(sourceRoot: string): string {
  const wildcard = sourceRoot.indexOf('*');
  const withoutGlob =
    wildcard === -1 ? sourceRoot : sourceRoot.slice(0, wildcard);
  return withoutGlob.replace(/\/$/, '');
}

function currentGuideSources(): string[] {
  return manifest.baseline.sourceRoots
    .flatMap((sourceRoot) =>
      walk(path.join(repoRoot, sourceDirectory(sourceRoot))),
    )
    .filter((source) => source.endsWith('.mdx'))
    .map((source) => path.relative(repoRoot, source))
    .sort();
}

function docId(source: string): string {
  return source.replace(/^docs\//, '').replace(/\.mdx$/, '');
}

function sidebarIncludes(source: string): boolean {
  const escaped = docId(source).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`id:\\s*['\"]${escaped}['\"]`).test(sidebar);
}

function frontmatterValue(content: string, key: string): string | undefined {
  if (!content.startsWith('---\n')) return undefined;
  const end = content.indexOf('\n---\n', 4);
  if (end === -1) return undefined;
  const match = new RegExp(`^${key}:\\s*(.+)$`, 'm').exec(
    content.slice(4, end),
  );
  return match?.[1].trim().replace(/^(['\"])(.*)\1$/, '$2');
}

function routeForSource(source: string): string | null {
  if (path.basename(source).startsWith('_')) return null;

  const content = fs.readFileSync(path.join(repoRoot, source), 'utf8');
  const slug = frontmatterValue(content, 'slug');
  if (slug?.startsWith('/')) return slug.replace(/\/$/, '') || '/';

  const segments = docId(source).split('/');
  if (slug) {
    segments.pop();
    segments.push(...slug.split('/').filter(Boolean));
  } else if (
    segments.length > 1 &&
    segments.at(-1)?.toLowerCase() === segments.at(-2)?.toLowerCase()
  ) {
    segments.pop();
  }
  return `/${segments.join('/')}`;
}

function activeSource(entry: MigrationEntry): string | null {
  if (
    entry.status === 'completed' &&
    (entry.disposition === 'convert' || entry.disposition === 'retire')
  ) {
    return null;
  }
  return entry.currentSource;
}

function expectDirectRedirects(entry: MigrationEntry) {
  expect(manifest.redirectPolicy.canonicalStores).toEqual([
    'redirects.json',
    'vercel.json',
  ]);
  expect(manifest.redirectPolicy.aliasStore).toBe('redirects.json');
  expect(manifest.redirectPolicy.directOnly).toBe(true);

  expect(clientRedirects).toContainEqual({
    from: entry.route,
    to: entry.destination,
  });
  expect(vercel.redirects ?? []).toContainEqual({
    source: entry.route,
    destination: entry.destination,
    permanent: true,
  });
  for (const alias of entry.aliases) {
    expect(clientRedirects).toContainEqual({
      from: alias,
      to: entry.destination,
    });
  }

  const migrationOrigins = new Set([entry.route, ...entry.aliases]);
  for (const redirect of permalinks) {
    if (migrationOrigins.has(redirect.from)) {
      expect(redirect.to, redirect.from).toBe(entry.destination);
    }
  }

  expect(
    [...clientRedirects, ...permalinks].some(
      (redirect) => redirect.from === entry.destination,
    ),
  ).toBe(false);
  expect(
    (vercel.redirects ?? []).some(
      (redirect) => redirect.source === entry.destination,
    ),
  ).toBe(false);
}

function expectPublicRecipe(destination: string) {
  const recipeId = destination.replace(/^\/cookbook\//, '');
  const registry = readJson<
    Array<{ id: string; hidden?: boolean; visibility?: string }>
  >('data/cookbook-registry.json');
  const compiled = readJson<{ recipes: Array<{ id: string }> }>(
    'src/data/recipes.json',
  );
  const recipe = registry.find((candidate) => candidate.id === recipeId);

  expect(recipe).toBeDefined();
  expect(recipe?.hidden).not.toBe(true);
  expect(recipe?.visibility).not.toBe('preview');
  expect(compiled.recipes.some((candidate) => candidate.id === recipeId)).toBe(
    true,
  );
  expect(
    fs.existsSync(path.join(repoRoot, 'docs', 'cookbook', `${recipeId}.mdx`)),
  ).toBe(true);
}

describe('legacy guide migration manifest', () => {
  it('covers the accepted 37-file baseline exactly once', () => {
    expect(manifest.schemaVersion).toBe(1);
    expect(manifest.baseline).toMatchObject({
      developerSiteCommit: 'd27e59050214c990fd9df16df1e35280aa59c8d8',
      sourceRoots: [
        'docs/guides/**/*.mdx',
        'docs/libraries/web-sdk/guides/*.mdx',
      ],
      sourceCount: 37,
    });
    expect(manifest.entries).toHaveLength(37);
    expect(new Set(manifest.entries.map((entry) => entry.source)).size).toBe(
      37,
    );
    expect(new Set(manifest.entries.map((entry) => entry.route)).size).toBe(37);

    const origins = manifest.entries.flatMap((entry) => [
      entry.route,
      ...entry.aliases,
    ]);
    expect(new Set(origins).size).toBe(origins.length);

    const counts = Object.fromEntries(
      ['retain', 'update', 'convert', 'retire'].map((disposition) => [
        disposition,
        manifest.entries.filter((entry) => entry.disposition === disposition)
          .length,
      ]),
    );
    expect(counts).toEqual({ retain: 14, update: 7, convert: 7, retire: 9 });
  });

  it('tracks every current guide source and rejects unclassified additions', () => {
    const tracked = manifest.entries
      .map(activeSource)
      .filter((source): source is string => source !== null)
      .sort();

    expect(currentGuideSources()).toEqual(tracked);
  });

  it('contains only public migration metadata', () => {
    const serialized = fs.readFileSync(manifestPath, 'utf8');
    expect(serialized).not.toMatch(/linear\.app|PACT-\d+|\bgo\//i);
    expect(serialized).not.toMatch(/-be\.glean\.com|@glean\.com/i);
  });

  it('preserves pending and retained sources with their declared routes and navigation', () => {
    for (const entry of manifest.entries) {
      const source = activeSource(entry);
      if (!source) continue;

      expect(fs.existsSync(path.join(repoRoot, source)), entry.id).toBe(true);
      expect(sidebarIncludes(source), entry.id).toBe(entry.sidebar);

      if (entry.routeType === 'page') {
        expect(routeForSource(source), entry.id).toBe(entry.route);
      }
    }
  });

  it('requires completed retirements and conversions to remove source, navigation, and route collisions', () => {
    const currentRoutes = new Set(
      currentGuideSources()
        .map(routeForSource)
        .filter((route): route is string => route !== null),
    );

    for (const entry of manifest.entries) {
      if (
        entry.status !== 'completed' ||
        (entry.disposition !== 'convert' && entry.disposition !== 'retire')
      ) {
        continue;
      }

      expect(entry.destinationReady, entry.id).toBe(true);
      expect(entry.currentSource, entry.id).toBeNull();
      expect(fs.existsSync(path.join(repoRoot, entry.source)), entry.id).toBe(
        false,
      );
      expect(sidebarIncludes(entry.source), entry.id).toBe(false);
      expect(currentRoutes.has(entry.route), entry.id).toBe(false);
      expectDirectRedirects(entry);

      if (entry.disposition === 'convert') {
        expect(entry.destination).toMatch(/^\/cookbook\/[a-z0-9-]+$/);
        expectPublicRecipe(entry.destination);
      }
    }
  });

  it('keeps imported fragments reachable only through their parent after completion', () => {
    const fragments = manifest.entries.filter(
      (entry) => entry.routeType === 'imported-fragment',
    );
    expect(fragments).toHaveLength(1);

    for (const entry of fragments) {
      expect(entry.disposition).not.toBe('retire');
      expect(entry.currentSource).not.toBeNull();
      const source = entry.currentSource as string;
      const parent = manifest.entries.find(
        (candidate) => candidate.route === entry.destination,
      );
      expect(parent).toBeDefined();
      expect(parent?.currentSource).not.toBeNull();

      const parentContent = fs.readFileSync(
        path.join(repoRoot, parent?.currentSource as string),
        'utf8',
      );
      expect(parentContent).toContain(`./${path.basename(source)}`);
      expect(sidebarIncludes(source)).toBe(false);

      if (entry.status === 'completed') {
        expect(path.basename(source)).toMatch(/^_/);
        expect(routeForSource(source)).toBeNull();
        expect(
          clientRedirects.some((redirect) => redirect.from === entry.route),
        ).toBe(false);
        expect(
          (vercel.redirects ?? []).some(
            (redirect) => redirect.source === entry.route,
          ),
        ).toBe(false);
      }
    }
  });
});
