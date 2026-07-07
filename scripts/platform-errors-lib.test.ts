import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildPlatformErrorsOutput,
  type PlatformErrorRemediationCatalog,
  type PlatformOpenApiSpec,
  writePlatformErrorDocs,
} from './platform-errors-lib';

const spec = {
  components: {
    schemas: {
      PlatformProblemDetailCode: {
        enum: ['invalid_cursor', 'resource_not_found'],
        'x-glean-problem-detail-codes': {
          invalid_cursor: {
            status: 400,
            title: 'Invalid Pagination Cursor',
          },
          resource_not_found: {
            status: 404,
            title: 'Resource Not Found',
          },
        },
      },
    },
  },
} satisfies PlatformOpenApiSpec;

const catalog = {
  invalid_cursor: {
    meaning: 'The pagination cursor cannot be used for this request.',
    commonCauses: [
      'The cursor is malformed or belongs to a different request.',
    ],
    clientRemediation: [
      'Start a new list or search request and use the returned cursor.',
    ],
    retryGuidance: 'Do not retry with the same cursor.',
    relatedDocs: [
      { title: 'Pagination', href: '/api/platform-api/search-overview' },
    ],
  },
  resource_not_found: {
    meaning: 'The requested resource or endpoint could not be found.',
    commonCauses: [
      'The resource does not exist or is not visible to the caller.',
    ],
    clientRemediation: [
      'Check the resource identifier and caller permissions.',
    ],
    adminRemediation: [
      'Confirm the resource exists and the integration has access.',
    ],
    retryGuidance: 'Retry only after correcting the identifier or permissions.',
  },
} satisfies PlatformErrorRemediationCatalog;

describe('buildPlatformErrorsOutput', () => {
  it('derives machine fields from OpenAPI and remediation from catalog', () => {
    const output = buildPlatformErrorsOutput(
      spec,
      catalog,
      '2026-07-06T00:00:00.000Z',
    );

    expect(output.errors).toHaveLength(2);
    expect(output.errors[0]).toMatchObject({
      code: 'invalid_cursor',
      slug: 'invalid-cursor',
      status: 400,
      title: 'Invalid Pagination Cursor',
      canonicalUrl: 'https://developers.glean.com/errors/invalid-cursor',
      docPath: 'docs/errors/invalid-cursor.mdx',
      remediation: catalog.invalid_cursor,
    });
    expect(output.errors[0].example).toEqual({
      type: 'https://developers.glean.com/errors/invalid-cursor',
      title: 'Invalid Pagination Cursor',
      status: 400,
      detail: 'Human-readable explanation specific to this occurrence.',
      code: 'invalid_cursor',
      documentation_url: 'https://developers.glean.com/errors/invalid-cursor',
      request_id: 'req_7f8a9b0c1d2e',
    });
  });

  it('fails when a public code lacks remediation content', () => {
    expect(() =>
      buildPlatformErrorsOutput(spec, {
        invalid_cursor: catalog.invalid_cursor,
      }),
    ).toThrow('missing remediation entries for: resource_not_found');
  });

  it('fails when metadata and enum values drift', () => {
    expect(() =>
      buildPlatformErrorsOutput(
        {
          components: {
            schemas: {
              PlatformProblemDetailCode: {
                enum: ['invalid_cursor'],
                'x-glean-problem-detail-codes': {
                  invalid_cursor: {
                    status: 400,
                    title: 'Invalid Pagination Cursor',
                  },
                  resource_not_found: {
                    status: 404,
                    title: 'Resource Not Found',
                  },
                },
              },
            },
          },
        },
        catalog,
      ),
    ).toThrow('metadata contains codes missing from enum: resource_not_found');
  });

  it('writes an index and one page for each public code', () => {
    const output = buildPlatformErrorsOutput(
      spec,
      catalog,
      '2026-07-06T00:00:00.000Z',
    );
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'platform-errors-'));

    writePlatformErrorDocs(output, {
      dataPath: path.join(dir, 'src/data/platform-errors.json'),
      docsDir: path.join(dir, 'docs/errors'),
    });

    expect(fs.existsSync(path.join(dir, 'docs/errors/index.mdx'))).toBe(true);
    expect(
      fs.existsSync(path.join(dir, 'docs/errors/invalid-cursor.mdx')),
    ).toBe(true);
    expect(
      fs.existsSync(path.join(dir, 'docs/errors/resource-not-found.mdx')),
    ).toBe(true);
    expect(
      JSON.parse(
        fs.readFileSync(
          path.join(dir, 'src/data/platform-errors.json'),
          'utf8',
        ),
      ),
    ).toMatchObject({
      totalCount: 2,
      errors: [
        { code: 'invalid_cursor', slug: 'invalid-cursor' },
        { code: 'resource_not_found', slug: 'resource-not-found' },
      ],
    });
  });
});
