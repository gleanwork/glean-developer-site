import fs from 'node:fs';
import path from 'node:path';
import * as yaml from 'js-yaml';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { find } from 'openapi-field-finder';
import {
  convertToDeprecationsOutput,
  type XGleanDeprecated,
  type XGleanRelease,
} from './deprecations-lib';
import { extractExperimentalEndpoints } from './experimental-lib';
import { deriveRelease, type ApiOperation } from './generator/endpointMetadata';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - plain .mjs module without type declarations
import { injectExperimentalHeaders } from './openapi-capitalize-language.mjs';
import {
  normalizeRelease,
  StageBadge,
} from '../src/theme/EndpointMetadata/parts';
import type { EndpointRelease } from '../src/types/endpointMetadata';

vi.mock('@theme/Icons', () => ({
  Icon: ({ name }: { name: string }) => <svg data-icon={name} />,
}));

const FIXTURE = path.join(__dirname, 'fixtures', 'release-stages.yaml');
const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'];

function loadFixture(): any {
  return yaml.load(fs.readFileSync(FIXTURE, 'utf8'));
}

function operations(spec: any): ApiOperation[] {
  return Object.entries(spec.paths).flatMap(([apiPath, item]: [string, any]) =>
    HTTP_METHODS.filter((m) => item[m]).map((method) => ({
      ...item[method],
      method,
      path: apiPath,
    })),
  );
}

describe('release-stages fixture', () => {
  it('renders the right label for each stage', () => {
    const labels: Record<string, string> = {};
    for (const op of operations(loadFixture())) {
      const { stage } = deriveRelease(op, []);
      const { container, unmount } = render(<StageBadge stage={stage} />);
      labels[op.path] = container.textContent ?? '';
      unmount();
    }

    expect(labels).toEqual({
      '/stage/beta': 'Beta',
      '/stage/ga': 'Generally available',
      '/stage/deprecated': 'Deprecated',
      '/legacy/experimental': 'Beta',
      '/legacy/deprecated': 'Deprecated',
      '/precedence': 'Generally available',
    });
  });

  it('shows Beta on pages generated with the old experimental stage', () => {
    const old = { stage: 'experimental', since: '2026-05-12' };
    const release = normalizeRelease(old as unknown as EndpointRelease);

    expect(release).toEqual({
      stage: 'beta',
      since: '2026-05-12',
      optIn: true,
    });
    const { container } = render(<StageBadge stage={release.stage} />);
    expect(container.textContent).toBe('Beta');
  });

  it('lists each deprecation and its introduced date', async () => {
    const results = {
      ...(await find<XGleanDeprecated>('x-glean-deprecated', [FIXTURE])),
      ...(await find<XGleanRelease>('x-glean-release', [FIXTURE])),
    };
    const output = convertToDeprecationsOutput(results);

    const summary = output.endpoints.map((endpoint) => ({
      endpoint: `${endpoint.method} ${endpoint.path}`,
      deprecations: endpoint.deprecations.map((d) =>
        [d.type, d.name, d.enumValue, d.introduced, d.removal, d.docs]
          .filter(Boolean)
          .join(' | '),
      ),
    }));

    expect(summary).toEqual([
      {
        endpoint: 'POST /legacy/deprecated',
        deprecations: [
          'endpoint | POST /legacy/deprecated | 2026-02-01 | 2027-10-15',
          'enum-value | legacyEnum | LEGACY | 2026-02-04 | 2027-10-18',
        ],
      },
      {
        endpoint: 'POST /stage/deprecated',
        deprecations: [
          'endpoint | POST /stage/deprecated | 2026-10-01 | 2027-04-15 | /guides/migrate',
          'parameter | param[0] | 2026-10-02 | 2027-04-16',
          'field | releaseField | 2026-10-03 | 2027-04-17',
          'enum-value | releaseEnum | LEGACY | 2026-10-04 | 2027-04-18',
          'enum-value | releaseEnum | OLD | 2026-10-05 | 2027-04-19',
        ],
      },
    ]);
    expect(output.totalCount).toBe(7);

    const ids = output.endpoints.flatMap((e) =>
      e.deprecations.map((d) => d.id),
    );
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain('POST /stage/deprecated enum-value releaseEnum OLD');
  });

  it('lists beta operations for the sidebar badge', () => {
    const endpoints = extractExperimentalEndpoints(
      loadFixture(),
      'api/test-api',
    );

    expect(endpoints.map((e) => e.docId)).toEqual([
      'api/test-api/stage-beta',
      'api/test-api/legacy-experimental',
    ]);
    expect(endpoints[1]).toMatchObject({
      id: '4abc1e17-8e06-490b-99a7-e8f97592405a',
      introduced: '2026-05-12',
    });
  });

  it('adds the opt-in header only to beta operations', () => {
    const spec = loadFixture();
    injectExperimentalHeaders(spec);

    const withHeader = operations(spec)
      .filter((op: any) =>
        (op.parameters ?? []).some(
          (p: any) => p.name === 'X-Glean-Include-Experimental',
        ),
      )
      .map((op) => op.path);

    expect(withHeader).toEqual(['/stage/beta', '/legacy/experimental']);
  });
});
