import type {
  ChangeType,
  NormalizedChange,
  RawRelease,
  SourceRef,
} from '../types.js';

const EMOJI_SHORTCODES =
  /:(rocket|bug|house|memo|warning|lock|boom|sparkles|white_check_mark|x):/gi;

export const CHANGE_TYPE_ORDER: ChangeType[] = [
  'added',
  'fixed',
  'changed',
  'deprecated',
  'docs',
  'internal',
];

export function stripEmoji(text: string): string {
  return text
    .replace(EMOJI_SHORTCODES, '')
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/[\uFE0E\uFE0F]/g, '');
}

export function normalizeWhitespace(text: string): string {
  return stripEmoji(text)
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function cleanInlineMarkdown(text: string): string {
  return normalizeWhitespace(text)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/\s*\(\[@[^\]]+\]\([^)]+\)\)/g, '')
    .replace(/\s*\(@[a-z0-9_-]+\)/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function stripConventionalPrefix(text: string): string {
  return text
    .replace(
      /^(feat|fix|docs|doc|chore|refactor|perf|test|build|ci|deps|internal|task|breaking)(\([^)]+\))?!?:\s*/i,
      '',
    )
    .trim();
}

export function ensureSentence(text: string): string {
  const cleaned = cleanInlineMarkdown(text);
  if (!cleaned) return '';
  const capitalized = cleaned[0].toUpperCase() + cleaned.slice(1);
  return /[.!?]$/.test(capitalized) ? capitalized : `${capitalized}.`;
}

function trimDanglingSentenceEnd(text: string): string {
  return text
    .replace(
      /\s+(and|or|to|on|in|for|from|with|across|including|include|includes|of|the|a|an)$/i,
      '',
    )
    .trim();
}

function cleanSentenceEnd(text: string): string {
  const cleaned = trimDanglingSentenceEnd(text.replace(/[.!?]$/, ''));
  return ensureSentence(cleaned);
}

export function truncateSentence(text: string, maxChars = 240): string {
  const sentence = cleanSentenceEnd(ensureSentence(text));
  if (sentence.length <= maxChars) return sentence;

  const sentenceEnd = sentence.slice(0, maxChars).search(/[.!?]\s+/);
  if (sentenceEnd >= 80) return sentence.slice(0, sentenceEnd + 1).trim();

  const softBreaks = [';', ','];
  for (const softBreak of softBreaks) {
    const idx = sentence.lastIndexOf(softBreak, maxChars);
    if (idx >= 80) return ensureSentence(sentence.slice(0, idx));
  }

  const clipped = trimDanglingSentenceEnd(
    sentence
      .slice(0, maxChars)
      .replace(/\s+\S*$/, '')
      .trim(),
  );
  return ensureSentence(clipped);
}

export function sourceRefKey(ref: SourceRef): string {
  return `${ref.label}\n${ref.url}`;
}

export function dedupeSourceRefs(refs: SourceRef[]): SourceRef[] {
  const seen = new Set<string>();
  const deduped: SourceRef[] = [];
  for (const rawRef of refs) {
    const ref = {
      label: cleanInlineMarkdown(rawRef.label),
      url: rawRef.url.trim(),
    };
    if (!ref.url) continue;
    const key = sourceRefKey(ref);
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(ref);
  }
  return deduped;
}

export function releaseSourceRef(release: RawRelease): SourceRef | null {
  return release.url ? { label: 'Release notes', url: release.url } : null;
}

export function extractPrRef(
  text: string,
  release: RawRelease,
): { text: string; ref: SourceRef | null } {
  const markdown = text.match(/\[#(\d+)\]\(([^)]+)\)/);
  if (markdown) {
    return {
      text: text.replace(markdown[0], '').trim(),
      ref: { label: `PR #${markdown[1]}`, url: markdown[2] },
    };
  }

  const suffix = text.match(/\s+\(#(\d+)\)\s*$/);
  if (suffix) {
    const number = suffix[1];
    return {
      text: text.replace(suffix[0], '').trim(),
      ref: {
        label: `PR #${number}`,
        url: `https://github.com/${release.owner}/${release.repo}/pull/${number}`,
      },
    };
  }

  return { text, ref: null };
}

export function addChange(
  changes: NormalizedChange[],
  change: NormalizedChange,
): void {
  const text = truncateSentence(change.text, 400);
  if (!text) return;
  const duplicate = changes.some(
    (existing) =>
      cleanInlineMarkdown(existing.text) === cleanInlineMarkdown(text),
  );
  if (duplicate) return;
  changes.push({
    ...change,
    text,
    sourceRefs: change.sourceRefs ? dedupeSourceRefs(change.sourceRefs) : [],
  });
}

export function isNoSignalText(text: string): boolean {
  const normalized = cleanInlineMarkdown(text).toLowerCase();
  if (!normalized) return true;
  return (
    normalized.includes('cannot be generated') ||
    normalized.includes("can't be generated") ||
    normalized.includes('please paste the full release notes') ||
    normalized.includes('no release notes content was provided') ||
    normalized.includes('no changes documented') ||
    normalized === 'full release notes:'
  );
}

export function changeTextWithContext(text: string, context?: string): string {
  const cleaned = cleanInlineMarkdown(stripConventionalPrefix(text));
  if (!cleaned) return '';
  return context ? `${cleanInlineMarkdown(context)}: ${cleaned}` : cleaned;
}
