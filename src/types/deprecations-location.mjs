/**
 * Map an API endpoint path to its human-readable surface label.
 *
 * Shared by the deprecations page component and the RSS feed generator.
 * Indexing endpoints live under `/api/index/`; everything else is Client API.
 *
 * @param {string} path - The endpoint path, e.g. `/api/index/v1/bulkindexemployees`.
 * @returns {string} Either `'Indexing API'` or `'Client API'`.
 */
export function getLocationFromPath(path) {
  if (path.startsWith('/api/index/')) {
    return 'Indexing API';
  }
  return 'Client API';
}
