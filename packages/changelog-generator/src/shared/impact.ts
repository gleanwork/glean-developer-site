export type ChangelogImpact =
  'breaking' | 'action_required' | 'deprecated' | 'noteworthy' | 'routine';

export interface ChangelogAttention {
  level: Exclude<ChangelogImpact, 'routine'>;
  label: string;
}

export interface ChangelogImpactClassification {
  impact: ChangelogImpact;
  attention: ChangelogAttention[];
}

const DEPRECATED_PATTERNS = [/\bdeprecated\b/i, /\bdeprecation\b/i];

const NOTEWORTHY_PATTERNS = [
  /\bnew endpoint\b/i,
  /\badded endpoint\b/i,
  /\badded support\b/i,
  /\bnow supports\b/i,
  /\bnew feature\b/i,
  /\bnew capability\b/i,
  /\bintroduced\b/i,
  /\bprivate beta\b/i,
];

function hasBreakingChange(content: string, categories: string[]): boolean {
  return (
    categories.some((category) => /^breaking$/i.test(category)) ||
    /^##\s+Breaking Changes\b/im.test(content) ||
    /^\s*-\s*Breaking:/im.test(content) ||
    /\bbreaking changes?\b/i.test(content)
  );
}

function matchesAny(content: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(content));
}

function hasActionRequired(content: string): boolean {
  return /^##\s+Action Required\b/im.test(content);
}

export function classifyChangelogImpact(
  content: string,
  categories: string[],
): ChangelogImpactClassification {
  const attention: ChangelogAttention[] = [];

  if (hasBreakingChange(content, categories)) {
    attention.push({ level: 'breaking', label: 'Breaking' });
  }

  if (hasActionRequired(content)) {
    attention.push({
      level: 'action_required',
      label: 'Action required',
    });
  }

  if (matchesAny(content, DEPRECATED_PATTERNS)) {
    attention.push({ level: 'deprecated', label: 'Deprecated' });
  }

  if (matchesAny(content, NOTEWORTHY_PATTERNS)) {
    attention.push({ level: 'noteworthy', label: 'Noteworthy' });
  }

  const impact =
    attention.find((item) => item.level === 'breaking')?.level ||
    attention.find((item) => item.level === 'action_required')?.level ||
    attention.find((item) => item.level === 'deprecated')?.level ||
    attention.find((item) => item.level === 'noteworthy')?.level ||
    'routine';

  return {
    impact,
    attention,
  };
}
