import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import betaData from '@site/src/data/beta.json';
import platformEndpointsData from '@site/src/data/platform-endpoints.json';
import type { PlatformEndpointsData } from '@site/src/types/platformEndpoints';
import {
  PLATFORM_CAPABILITIES,
  belongsToCapability,
  getPlatformStatuses,
  isBetaEndpoint,
  platformBadge,
} from './platformStatus';

const doc = (slug: string) => ({ docId: `api/platform-api/${slug}` });

const publishedCatalog = Object.values(
  (platformEndpointsData as PlatformEndpointsData).families,
).flatMap((family) => family.endpoints);

describe('getPlatformStatuses', () => {
  it('keeps a capability GA when it still has a GA endpoint', () => {
    const beta = [doc('platform-search-enumeration')];
    const catalog = [
      doc('platform-search'),
      doc('platform-search-filters'),
      doc('platform-search-enumeration'),
    ];

    const statuses = getPlatformStatuses(beta, PLATFORM_CAPABILITIES, catalog);

    expect(statuses.find((status) => status.label === 'Search')).toEqual({
      label: 'Search',
      stage: 'ga',
    });
    expect(isBetaEndpoint(beta[0].docId, beta)).toBe(true);
    expect(isBetaEndpoint(doc('platform-search').docId, beta)).toBe(false);
  });

  it('marks a capability beta when every endpoint is beta', () => {
    const endpoints = [
      doc('platform-documents-get'),
      doc('platform-documents-get-by-url'),
      doc('platform-documents-batch'),
    ];

    const statuses = getPlatformStatuses(
      endpoints,
      PLATFORM_CAPABILITIES,
      endpoints,
    );

    expect(statuses.find((status) => status.label === 'Documents')).toEqual({
      label: 'Documents',
      stage: 'beta',
    });
    expect(
      endpoints.every((endpoint) => isBetaEndpoint(endpoint.docId, endpoints)),
    ).toBe(true);
  });

  it('marks an unpublished capability beta when its only endpoints are beta', () => {
    const statuses = getPlatformStatuses(
      [doc('platform-skills-create')],
      [{ label: 'Skills', docPrefixes: ['platform-skills'] }],
      [],
    );

    expect(statuses).toEqual([{ label: 'Skills', stage: 'beta' }]);
  });

  it('treats a capability with no endpoints as GA', () => {
    const statuses = getPlatformStatuses(
      [],
      [{ label: 'Search', docPrefixes: ['platform-search'] }],
      [],
    );

    expect(statuses).toEqual([{ label: 'Search', stage: 'ga' }]);
  });

  // #923 adds POST /api/search/enumeration (platform-search-enumeration) as
  // the only beta Search endpoint. Search stays GA, so the platform
  // search video (narrated GA) does not drift.
  it('keeps Search GA when only the enumeration endpoint is beta', () => {
    const enumeration = doc('platform-search-enumeration');
    const statuses = getPlatformStatuses(
      [...betaData.endpoints, enumeration],
      PLATFORM_CAPABILITIES,
      [...publishedCatalog, enumeration],
    );

    expect(statuses.find((status) => status.label === 'Search')).toEqual({
      label: 'Search',
      stage: 'ga',
    });
    expect(statuses.find((status) => status.label === 'Triggers')).toEqual({
      label: 'Triggers',
      stage: 'beta',
    });
    expect(isBetaEndpoint(enumeration.docId, [enumeration])).toBe(true);
  });

  it('ignores beta endpoints outside the Platform API', () => {
    const statuses = getPlatformStatuses(
      [{ docId: 'api/client-api/search/platform-search' }],
      PLATFORM_CAPABILITIES,
      [],
    );

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

describe('platformBadge', () => {
  it('reads GA once any capability has graduated', () => {
    expect(
      platformBadge([
        { label: 'Search', stage: 'ga' },
        { label: 'Skills', stage: 'beta' },
      ]),
    ).toEqual({ label: 'Generally available', ga: true });
  });

  it('falls back to beta when nothing is GA', () => {
    expect(platformBadge([{ label: 'Skills', stage: 'beta' }])).toEqual({
      label: 'Beta',
      ga: false,
    });
  });
});

describe('generated data contract', () => {
  const generatedSlugs = fs
    .readdirSync(path.resolve('docs/api/platform-api'))
    .filter((file) => file.endsWith('.api.mdx'))
    .map((file) => `api/platform-api/${file.replace(/\.api\.mdx$/, '')}`);

  const publishedDocIds = Object.values(
    JSON.parse(
      fs.readFileSync(path.resolve('src/data/platform-endpoints.json'), 'utf8'),
    ).families as Record<string, { endpoints: { docId: string }[] }>,
  ).flatMap((family) => family.endpoints.map((endpoint) => endpoint.docId));

  it.each(PLATFORM_CAPABILITIES)(
    '$label matches at least one generated Platform API page',
    (capability) => {
      // A family can be listed before regenerate publishes its pages.
      // Require a generated page once platform-endpoints.json includes it.
      const published = publishedDocIds.some((docId) =>
        belongsToCapability(docId, capability),
      );
      if (!published) {
        return;
      }
      expect(
        generatedSlugs.some((docId) => belongsToCapability(docId, capability)),
      ).toBe(true);
    },
  );

  it('covers every beta Platform API endpoint', () => {
    const uncovered = betaData.endpoints
      .filter((e) => e.docId.startsWith('api/platform-api/'))
      .filter(
        (e) =>
          !PLATFORM_CAPABILITIES.some((c) => belongsToCapability(e.docId, c)),
      )
      .map((e) => e.docId);

    expect(uncovered).toEqual([]);
  });
});
