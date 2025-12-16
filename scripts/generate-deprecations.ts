#!/usr/bin/env tsx

/**
 * Generate deprecations.json from OpenAPI specs by extracting x-glean-deprecated properties
 *
 * Usage: pnpm generate:deprecations
 */

import { generateDeprecations, type EndpointGroup } from './deprecations-lib';

/**
 * Test endpoints for local development.
 * These use real endpoints from the OpenAPI specs to demonstrate deprecations.
 */
const testExtraEndpoints: EndpointGroup[] = [
  // Search endpoint - field and enum-value deprecations
  {
    method: 'POST',
    path: '/api/v1/search',
    deprecations: [
      {
        id: 'search-disable-spellcheck-dep',
        type: 'field',
        name: 'disableSpellcheck',
        message:
          'The disableSpellcheck field is deprecated. Use requestOptions.spellcheckMode instead.',
        introduced: '2026-01-15',
        removal: '2026-07-15',
        docs: 'https://developers.glean.com/docs/migrations/spellcheck-options',
      },
      {
        id: 'search-cluster-type-none-dep',
        type: 'enum-value',
        name: 'clusterType',
        enumValue: 'NONE',
        message:
          'The NONE cluster type is deprecated. Omit the clusterType field instead.',
        introduced: '2026-02-01',
        removal: '2026-10-15',
      },
    ],
  },
  // Chat endpoint - field deprecations
  {
    method: 'POST',
    path: '/api/v1/chat',
    deprecations: [
      {
        id: 'chat-save-chat-dep',
        type: 'field',
        name: 'saveChat',
        message:
          'The saveChat field is deprecated. Use chatPersistence instead.',
        introduced: '2026-03-01',
        removal: '2027-01-15',
        docs: 'https://developers.glean.com/docs/migrations/chat-persistence',
      },
      {
        id: 'chat-timeout-millis-dep',
        type: 'field',
        name: 'timeoutMillis',
        message:
          'The timeoutMillis field is deprecated. Use requestOptions.timeout instead.',
        introduced: '2026-03-15',
        removal: '2027-01-15',
      },
    ],
  },
  // Autocomplete endpoint - field deprecation
  {
    method: 'POST',
    path: '/api/v1/autocomplete',
    deprecations: [
      {
        id: 'autocomplete-tracking-token-dep',
        type: 'field',
        name: 'trackingToken',
        message:
          'The trackingToken field is deprecated. Use requestId instead for request tracking.',
        introduced: '2026-04-01',
        removal: '2027-04-15',
        docs: 'https://developers.glean.com/docs/migrations/request-tracking',
      },
    ],
  },
  // Indexing endpoint - field deprecation
  {
    method: 'POST',
    path: '/api/index/v1/indexdocument',
    deprecations: [
      {
        id: 'indexdocument-version-dep',
        type: 'field',
        name: 'version',
        message:
          'The version field is deprecated. Use document.metadata.version for optimistic concurrency control.',
        introduced: '2026-02-15',
        removal: '2026-10-15',
        docs: 'https://developers.glean.com/docs/migrations/document-versioning',
      },
    ],
  },
  // Bulk indexing endpoint - field deprecation
  {
    method: 'POST',
    path: '/api/index/v1/indexdocuments',
    deprecations: [
      {
        id: 'indexdocuments-uploadid-dep',
        type: 'field',
        name: 'uploadId',
        message:
          'The uploadId field is deprecated. Use batchId for tracking bulk uploads.',
        introduced: '2026-04-10',
        removal: '2027-04-15',
      },
    ],
  },
  // Feed endpoint - enum-value deprecation
  {
    method: 'POST',
    path: '/api/v1/feed',
    deprecations: [
      {
        id: 'feed-category-all-dep',
        type: 'enum-value',
        name: 'category',
        enumValue: 'ALL',
        message:
          'The ALL category is deprecated. Use MIXED to retrieve all feed types.',
        introduced: '2026-03-20',
        removal: '2027-01-15',
      },
    ],
  },
];

async function main() {
  await generateDeprecations(
    [
      './openapi/client/client-capitalized.yaml',
      './openapi/indexing/indexing-capitalized.yaml',
    ],
    './src/data/deprecations.json',
    testExtraEndpoints,
  );
}

main().catch((error) => {
  console.error('Error generating deprecations:', error);
  process.exit(1);
});
