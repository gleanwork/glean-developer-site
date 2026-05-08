export type ChangelogImpact =
  | 'breaking'
  | 'action_required'
  | 'deprecated'
  | 'noteworthy'
  | 'routine';

export interface ChangelogAttention {
  level: Exclude<ChangelogImpact, 'routine'>;
  label: string;
}

export interface ChangelogEntry {
  id: string;
  slug: string;
  title: string;
  date: string; // ISO date string
  tags: Array<string>;
  categories: Array<string>; // Processed semantic categories
  impact: ChangelogImpact;
  attention: Array<ChangelogAttention>;
  summary: string;
  fullContent: string;
  hasTruncation: boolean;
  fileName: string;
}

export interface ChangelogData {
  entries: Array<ChangelogEntry>;
  tags: Array<string>;
  categories: Array<string>; // All unique categories for filtering
  generatedAt: string;
  totalEntries: number;
}

// Map tags to semantic categories
export const TAG_TO_CATEGORY_MAP: Record<string, string> = {
  // Primary component tags
  'Client API': 'API',
  'Indexing API': 'API',
  'API Clients': 'SDK',
  'Glean Agent Toolkit': 'SDK',
  'Glean Indexing SDK': 'SDK',
  'langchain-glean': 'SDK',
  MCP: 'SDK',

  // Legacy mappings for backward compatibility
  SDK: 'SDK',
  'Developer Site': 'Documentation',

  // Change type tags
  Feature: 'Feature',
  Enhancement: 'Enhancement',
  'Bug Fix': 'Bug Fix',
  Breaking: 'Breaking',
  Security: 'Security',
  Deprecation: 'Deprecation',
  Documentation: 'Documentation',
};

export const IMPACT_LABELS: Record<ChangelogImpact, string> = {
  breaking: 'Breaking',
  action_required: 'Action required',
  deprecated: 'Deprecated',
  noteworthy: 'Noteworthy',
  routine: 'Routine',
};
