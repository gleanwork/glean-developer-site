export const PRIMARY_CATEGORIES = [
  'API',
  'SDK',
  'MCP',
  'Website',
  'Documentation',
];

export const SECONDARY_CATEGORIES = [
  'Feature',
  'Enhancement',
  'Bug Fix',
  'Breaking',
  'Security',
  'Deprecation',
];

export function formatCategories(categories: Array<string>): string {
  return categories.map((category) => `"${category}"`).join(', ');
}
