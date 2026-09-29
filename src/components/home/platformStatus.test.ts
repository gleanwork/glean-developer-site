import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import experimentalData from '@site/src/data/experimental.json';
import {
  PLATFORM_CAPABILITIES,
  belongsToCapability,
  describePlatformStatuses,
  getPlatformStatuses,
} from './platformStatus';

const doc = (slug: string) => ({ docId: `api/platform-api/${slug}` });

describe('getPlatformStatuses', () => {
  it('marks a capability experimental when any endpoint is experimental', () => {
    const statuses = getPlatformStatuses([
      doc('platform-skills-create'),
      doc('platform-trigger-presets-list'),
    ]);

    expect(statuses).toEqual([
      { label: 'Search', stage: 'ga' },
      { label: 'Chat', stage: 'ga' },
      { label: 'Agents', stage: 'ga' },
      { label: 'Skills', stage: 'experimental' },
      { label: 'Triggers', stage: 'experimental' },
    ]);
  });

  it('ignores experimental endpoints outside the Platform API', () => {
    const statuses = getPlatformStatuses([
      { docId: 'api/client-api/search/platform-search' },
    ]);

    expect(statuses.every((s) => s.stage === 'ga')).toBe(true);
  });

  it('does not match on a partial slug', () => {
    const search = PLATFORM_CAPABILITIES[0];

    expect(
      belongsToCapability('api/platform-api/platform-search', search),
    ).toBe(true);
    expect(
      belongsToCapability('api/platform-api/platform-search-filters', search),
    ).toBe(true);
    expect(
      belongsToCapability('api/platform-api/platform-searchable', search),
    ).toBe(false);
  });
});

describe('describePlatformStatuses', () => {
  it('leads with GA and names the preview capabilities', () => {
    const copy = describePlatformStatuses([
      { label: 'Search', stage: 'ga' },
      { label: 'Chat', stage: 'ga' },
      { label: 'Agents', stage: 'ga' },
      { label: 'Skills', stage: 'experimental' },
      { label: 'Triggers', stage: 'experimental' },
    ]);

    expect(copy.tag).toBe('Generally available');
    expect(copy.body).toContain(
      'Search, Chat, and Agents are ready for production.',
    );
    expect(copy.body).toContain(
      'Skills and Triggers are available in experimental preview.',
    );
  });

  it('drops the preview sentence once everything is GA', () => {
    const copy = describePlatformStatuses([
      { label: 'Search', stage: 'ga' },
      { label: 'Skills', stage: 'ga' },
    ]);

    expect(copy.body).not.toMatch(/experimental/i);
  });

  it('uses singular agreement for one capability', () => {
    const copy = describePlatformStatuses([
      { label: 'Search', stage: 'ga' },
      { label: 'Skills', stage: 'experimental' },
    ]);

    expect(copy.body).toContain('Search is ready for production.');
    expect(copy.body).toContain('Skills is available in experimental preview.');
  });

  it('falls back to experimental framing when nothing is GA', () => {
    const copy = describePlatformStatuses([
      { label: 'Skills', stage: 'experimental' },
    ]);

    expect(copy.tag).toBe('Experimental');
  });
});

describe('generated data contract', () => {
  const generatedSlugs = fs
    .readdirSync(path.resolve('docs/api/platform-api'))
    .filter((file) => file.endsWith('.api.mdx'))
    .map((file) => `api/platform-api/${file.replace(/\.api\.mdx$/, '')}`);

  it.each(PLATFORM_CAPABILITIES)(
    '$label matches at least one generated Platform API page',
    (capability) => {
      expect(
        generatedSlugs.some((docId) => belongsToCapability(docId, capability)),
      ).toBe(true);
    },
  );

  it('covers every experimental Platform API endpoint', () => {
    const uncovered = experimentalData.endpoints
      .filter((e) => e.docId.startsWith('api/platform-api/'))
      .filter(
        (e) =>
          !PLATFORM_CAPABILITIES.some((c) => belongsToCapability(e.docId, c)),
      )
      .map((e) => e.docId);

    expect(uncovered).toEqual([]);
  });
});
