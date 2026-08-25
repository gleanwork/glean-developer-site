/* @vitest-environment node */

import { describe, expect, it } from 'vitest';
import { renderReport, summarizeDiff } from './openapi-diff-report';

const baseSpec = `openapi: 3.0.0
paths:
  /widgets:
    get:
      responses:
        '200':
          description: OK
`;

const headSpec = `openapi: 3.0.0
paths:
  /widgets:
    get:
      responses:
        '200':
          description: OK
`;

describe('OpenAPI diff report', () => {
  it('summarizes an endpoint change as an API-surface change', () => {
    const result = summarizeDiff(
      {
        changes: [
          {
            property: 'path',
            changeText: 'path added',
            new: '/widgets',
          },
        ],
      },
      baseSpec,
      headSpec,
    );

    expect(result.status).toBe('changed');
    expect(result.contractChanges).toBe(1);
    expect(result.summary).toContain('endpoint');
    expect(result.details.join('\n')).toContain('/widgets');
  });

  it('does not classify documentation metadata as an API-surface change', () => {
    const result = summarizeDiff(
      {
        changes: [
          {
            property: 'description',
            changeText: 'description changed',
            original: 'Old description',
            new: 'New description',
          },
        ],
      },
      baseSpec,
      headSpec,
    );

    expect(result.contractChanges).toBe(0);
    expect(result.breaking).toBe(false);
    expect(result.summary).toBe('1 documentation metadata change');
  });

  it('marks a report with API changes as requiring manual review', () => {
    const report = renderReport(
      [
        {
          name: 'Client',
          path: 'openapi/client/client-capitalized.yaml',
          status: 'changed',
          summary: '1 endpoint added',
          details: ['Added endpoint: /widgets'],
          contractChanges: 1,
          breaking: false,
          rawChangeCount: 1,
        },
      ],
      { total: 12, byDirectory: [{ directory: 'docs', count: 12 }] },
    );

    expect(report).toContain('Manual review required');
    expect(report).toContain('Added endpoint: /widgets');
    expect(report).not.toContain('Eligible for auto-merge');
  });

  it('marks a report with only generated changes as eligible for auto-merge', () => {
    const report = renderReport(
      [
        {
          name: 'Client',
          path: 'openapi/client/client-capitalized.yaml',
          status: 'changed',
          summary: '1 documentation metadata change',
          details: ['Modified description'],
          contractChanges: 0,
          breaking: false,
          rawChangeCount: 1,
        },
        {
          name: 'Indexing',
          path: 'openapi/indexing/indexing-capitalized.yaml',
          status: 'unchanged',
          summary: 'No OpenAPI changes',
          details: [],
          contractChanges: 0,
          breaking: false,
          rawChangeCount: 0,
        },
      ],
      { total: 12, byDirectory: [{ directory: 'docs', count: 12 }] },
    );

    expect(report).toContain('Eligible for auto-merge after CI passes');
    expect(report).toContain('Generated files changed:** 12');
  });
});
