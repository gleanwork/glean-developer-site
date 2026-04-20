import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const dbg: any = require('debug');
const dbgVal = dbg('changelog:validate');

// Words that don't count as meaningful content
const STRUCTURAL_WORDS = new Set([
  'the',
  'a',
  'an',
  'and',
  'or',
  'but',
  'in',
  'on',
  'at',
  'to',
  'for',
  'of',
  'with',
  'by',
  'from',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'has',
  'have',
  'had',
  'do',
  'does',
  'did',
  'will',
  'would',
  'could',
  'should',
  'may',
  'might',
  'can',
  'shall',
  'not',
  'no',
  'now',
  'new',
  'its',
  'it',
  'this',
  'that',
  'these',
  'those',
  'also',
  'plus',
]);

const ACTION_WORDS = new Set([
  'added',
  'adds',
  'add',
  'removed',
  'removes',
  'remove',
  'changed',
  'changes',
  'change',
  'updated',
  'updates',
  'update',
  'deprecated',
  'deprecates',
  'deprecate',
  'modified',
  'modifies',
  'breaking',
  'included',
  'includes',
]);

/**
 * Count meaningful unique content tokens in a summary.
 * Strips structural words, action verbs, and punctuation,
 * then counts unique remaining words.
 */
function countMeaningfulTokens(text: string): number {
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1)
    .filter((t) => !STRUCTURAL_WORDS.has(t))
    .filter((t) => !ACTION_WORDS.has(t));
  return new Set(tokens).size;
}

/**
 * Detect orphaned structural fragments — patterns where the LLM
 * echoed change-type markers without the actual content.
 */
function hasOrphanedFragments(text: string): boolean {
  const patterns = [
    // "- : added" or "- : changed" (colon with no preceding noun)
    /- :\s*(added|changed|removed|deprecated)/i,
    // "- added - added" (repeated bare action words as bullets)
    /- (adds?|changed?|removed?)\s+-\s+(adds?|changed?|removed?)/i,
    // "- adds and - adds" (conjunction fragments)
    /- (adds?|changed?)\s+and\s+-/i,
    // "- and add ," (orphaned conjunction)
    /- and (adds?|changed?)\s*,/i,
  ];
  return patterns.some((p) => p.test(text));
}

/**
 * Detect placeholder text from failed LLM summarization
 */
function hasPlaceholderText(text: string): boolean {
  const patterns = [
    /\bhas changed to\s*\./,
    /\bresponse of\s*\./,
    /\bis now included in\s+within\s+the\s+response/,
    /\bthe field is now included\s+in\s+within/,
    /\bfor\s+has changed to\s*\./,
    /\bthe\s+field\s+is\s+now\s+included\s+in\s+within/,
    /\bresponse\s+type\s+for\s+has\s+changed/,
    /^-\s*:\s*-?\s*\*\*/m,
  ];
  return patterns.some((p) => p.test(text));
}

export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Validate that a summary has meaningful content.
 * Uses positive structural checks rather than pattern-matching specific garbage.
 */
export function validateSummary(
  summary: string,
  opts: { maxChars?: number } = {},
): ValidationResult {
  const trimmed = summary.trim();

  if (!trimmed) {
    return { valid: false, reason: 'Summary is empty' };
  }

  if (opts.maxChars && trimmed.length > opts.maxChars) {
    return {
      valid: false,
      reason: `Summary exceeds ${opts.maxChars} chars (${trimmed.length})`,
    };
  }

  if (hasPlaceholderText(trimmed)) {
    dbgVal('validate:rejected placeholder text in: %s', trimmed.slice(0, 80));
    return {
      valid: false,
      reason: 'Summary contains placeholder text from failed LLM output',
    };
  }

  if (hasOrphanedFragments(trimmed)) {
    dbgVal('validate:rejected orphaned fragments in: %s', trimmed.slice(0, 80));
    return {
      valid: false,
      reason:
        'Summary contains orphaned structural fragments without meaningful content',
    };
  }

  const meaningfulTokens = countMeaningfulTokens(trimmed);
  if (meaningfulTokens < 5) {
    dbgVal(
      'validate:rejected low token count (%d) in: %s',
      meaningfulTokens,
      trimmed.slice(0, 80),
    );
    return {
      valid: false,
      reason: `Summary has only ${meaningfulTokens} meaningful tokens (minimum 5)`,
    };
  }

  return { valid: true };
}

/**
 * Validate that a rendered changelog entry has valid structure.
 */
export function validateRenderedEntry(content: string): ValidationResult {
  // Check frontmatter exists
  if (!content.startsWith('---\n')) {
    return { valid: false, reason: 'Missing YAML frontmatter' };
  }

  const endOfFrontmatter = content.indexOf('\n---\n', 4);
  if (endOfFrontmatter === -1) {
    return {
      valid: false,
      reason: 'Malformed YAML frontmatter (no closing ---)',
    };
  }

  const frontmatter = content.slice(4, endOfFrontmatter);

  // Check title exists
  if (!/^title:\s*.+/m.test(frontmatter)) {
    return { valid: false, reason: 'Missing title in frontmatter' };
  }

  // Check categories exist
  if (!/^categories:\s*\[.+\]/m.test(frontmatter)) {
    return { valid: false, reason: 'Missing categories in frontmatter' };
  }

  // Extract summary (content between frontmatter and truncate marker)
  const body = content.slice(endOfFrontmatter + 5).trim();
  const truncateIdx = body.indexOf('{/* truncate */}');
  const summary =
    truncateIdx !== -1 ? body.slice(0, truncateIdx).trim() : body.trim();

  if (!summary) {
    return { valid: false, reason: 'Empty summary section' };
  }

  return validateSummary(summary);
}
