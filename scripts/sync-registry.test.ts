import { describe, it, expect } from 'vitest';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - plain .mjs module without type declarations
import { extractPluginCoordinates } from './sync-registry.mjs';

/**
 * The real manifest as pluginpack emits it at the root of gleanwork/
 * glean-cookbook. These coordinates end up printed verbatim on every recipe
 * page (`/plugin install <plugin>@<marketplace>`, `/<plugin>:<recipe-id>`),
 * so the extraction asserts rather than defaults — a shape change upstream
 * should fail the sync, not quietly ship a wrong command.
 */
const MANIFEST = JSON.stringify({
  $schema: 'https://anthropic.com/claude-code/marketplace.schema.json',
  name: 'glean-cookbook',
  version: '0.1.0',
  description: 'Build Glean cookbook recipes hands-free.',
  owner: { name: 'Glean' },
  plugins: [
    {
      name: 'cookbook',
      source: './build/claude/cookbook',
      description: 'Build Glean cookbook recipes hands-free.',
      version: '0.1.0',
      author: { name: 'Glean' },
      homepage: 'https://developers.glean.com/cookbook',
      repository: 'https://github.com/gleanwork/glean-cookbook',
      license: 'MIT',
    },
  ],
});

function manifestWith(mutate: (m: Record<string, unknown>) => void) {
  const parsed = JSON.parse(MANIFEST);
  mutate(parsed);
  return JSON.stringify(parsed);
}

describe('extractPluginCoordinates', () => {
  it('pulls the names the recipe pages print', () => {
    expect(extractPluginCoordinates(MANIFEST)).toEqual({
      marketplaceName: 'glean-cookbook',
      pluginName: 'cookbook',
      repo: 'gleanwork/glean-cookbook',
    });
  });

  it('derives the repo slug from the plugin repository URL, not a constant', () => {
    const moved = manifestWith((m) => {
      (m.plugins as Array<Record<string, unknown>>)[0].repository =
        'https://github.com/gleanwork/cookbooks';
    });
    expect(extractPluginCoordinates(moved).repo).toBe('gleanwork/cookbooks');
  });

  it('accepts an SSH-style repository URL', () => {
    const ssh = manifestWith((m) => {
      (m.plugins as Array<Record<string, unknown>>)[0].repository =
        'git@github.com:gleanwork/glean-cookbook.git';
    });
    expect(ssh && extractPluginCoordinates(ssh).repo).toBe(
      'gleanwork/glean-cookbook',
    );
  });

  it('refuses to guess when more than one plugin is present', () => {
    const two = manifestWith((m) => {
      const plugins = m.plugins as Array<Record<string, unknown>>;
      plugins.push({ ...plugins[0], name: 'other' });
    });
    expect(() => extractPluginCoordinates(two)).toThrow(/found 2/);
  });

  it('refuses an empty plugins array rather than emitting undefined names', () => {
    const none = manifestWith((m) => {
      m.plugins = [];
    });
    expect(() => extractPluginCoordinates(none)).toThrow(/found 0/);
  });

  it('fails when the marketplace name is missing', () => {
    const nameless = manifestWith((m) => {
      delete m.name;
    });
    expect(() => extractPluginCoordinates(nameless)).toThrow(
      /missing a marketplace name or plugin name/,
    );
  });

  it('fails when the repository URL is absent rather than inventing a slug', () => {
    const noRepo = manifestWith((m) => {
      delete (m.plugins as Array<Record<string, unknown>>)[0].repository;
    });
    expect(() => extractPluginCoordinates(noRepo)).toThrow(
      /Could not derive a GitHub slug/,
    );
  });
});
