export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

const EMOJI_SHORTCODES =
  /:(rocket|bug|house|memo|warning|lock|boom|sparkles|white_check_mark|x):/i;

function hasEmoji(text: string): boolean {
  return /\p{Extended_Pictographic}/u.test(text) || EMOJI_SHORTCODES.test(text);
}

function hasFlattenedBullets(text: string): boolean {
  return /\.\s+-\s+\S/i.test(text);
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

  if (/^[-*]\s+/.test(trimmed)) {
    return {
      valid: false,
      reason: 'Summary must be prose, not a bullet',
    };
  }

  if (hasEmoji(trimmed)) {
    return {
      valid: false,
      reason: 'Summary contains emoji or emoji shortcode',
    };
  }

  if (hasFlattenedBullets(trimmed)) {
    return {
      valid: false,
      reason: 'Summary contains flattened inline bullets',
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

  if (hasEmoji(content)) {
    return { valid: false, reason: 'Rendered entry contains emoji' };
  }

  const markerCount = (content.match(/\{\/\*\s*truncate\s*\*\/\}/g) || [])
    .length;
  if (markerCount !== 1) {
    return {
      valid: false,
      reason: `Expected exactly one truncate marker, found ${markerCount}`,
    };
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
