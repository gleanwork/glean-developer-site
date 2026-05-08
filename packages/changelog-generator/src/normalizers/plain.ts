import type {
  ChangeType,
  NormalizedChange,
  NormalizedRelease,
  RawRelease,
  SourceRef,
} from '../types.js';
import {
  addChange,
  cleanInlineMarkdown,
  dedupeSourceRefs,
  isNoSignalText,
  releaseSourceRef,
  truncateSentence,
} from './utils.js';

const SOURCE_LINE = /^Full release notes:\s*\S+/i;

function headingToType(heading: string): ChangeType | null {
  const lower = heading.toLowerCase();
  if (lower.includes('breaking')) return 'breaking';
  if (lower.includes('fix') || lower.includes('bug')) return 'fixed';
  if (lower.includes('add') || lower.includes('feature')) return 'added';
  if (lower.includes('deprecat')) return 'deprecated';
  if (lower.includes('doc')) return 'docs';
  if (lower.includes('internal') || lower.includes('chore')) return 'internal';
  if (lower.includes('change') || lower.includes('update')) return 'changed';
  if (lower.includes('action required')) return null;
  if (lower.includes('source')) return null;
  return 'changed';
}

function stripFrontmatter(text: string): string {
  if (!text.startsWith('---')) return text;
  const end = text.indexOf('\n---', 3);
  if (end === -1) return text;
  return text.slice(end + 4);
}

function firstProseParagraph(body: string): string {
  const paragraphs = body.split(/\n{2,}/);
  for (const paragraph of paragraphs) {
    const lines = paragraph
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length === 0) continue;
    if (lines.some((line) => /^#{1,6}\s+/.test(line))) continue;
    if (lines.some((line) => /^[-*]\s+/.test(line))) continue;
    if (lines.some((line) => SOURCE_LINE.test(line))) continue;
    const cleaned = cleanInlineMarkdown(lines.join(' '));
    if (/^[\w &/-]+:\.?$/.test(cleaned)) continue;
    const summary = truncateSentence(cleaned);
    if (summary.includes('...')) continue;
    if (summary && !isNoSignalText(summary)) return summary;
  }
  return '';
}

function looksLikeRenderedScaffolding(text: string): boolean {
  const cleaned = cleanInlineMarkdown(text)
    .replace(/^[-#\s]+/, '')
    .replace(/\.+$/, '')
    .trim();
  return (
    /^(action required|changes|breaking changes|source|release notes)$/i.test(
      cleaned,
    ) ||
    /^this release only includes breaking(?: or deprecated)? changes$/i.test(
      cleaned,
    )
  );
}

function detectBulletType(text: string, currentType: ChangeType): ChangeType {
  if (/^(documentation|docs):/i.test(text)) return 'docs';
  if (/^(internal|chore):/i.test(text)) return 'internal';
  if (/^(enhancement|feature):/i.test(text)) return 'added';
  if (/^(bug fix|fix):/i.test(text)) return 'fixed';
  if (/^(changed|update):/i.test(text)) return 'changed';
  if (/^added endpoint\b/i.test(text)) return 'added';
  if (/^removed endpoint\b/i.test(text)) return 'breaking';
  if (/^deprecated\b/i.test(text)) return 'deprecated';
  if (/^(?:\*\*)?breaking\b/i.test(text)) return 'breaking';
  return currentType;
}

export function normalizePlainRelease(
  release: RawRelease,
  parser: 'plain' | 'legacy' | 'openapi' = 'plain',
): NormalizedRelease {
  const releaseRef = releaseSourceRef(release);
  const sourceRefs: SourceRef[] = releaseRef ? [releaseRef] : [];
  const changes: NormalizedChange[] = [];
  const warnings: string[] = [];

  const withoutFrontmatter = stripFrontmatter(release.body);
  const body = withoutFrontmatter
    .replace(/\{\/\*\s*truncate\s*\*\/\}/g, '\n')
    .split('\n')
    .filter((line) => !SOURCE_LINE.test(line.trim()))
    .join('\n');

  if (
    isNoSignalText(body) ||
    cleanInlineMarkdown(body) === `${release.repo} ${release.tag}`
  ) {
    return {
      release,
      parser,
      summary: '',
      changes,
      sourceRefs,
      warnings,
      isEmpty: true,
    };
  }

  const proseSummary = firstProseParagraph(body);
  let currentType: ChangeType = 'changed';
  let inSourceSection = false;
  for (const rawLine of body.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;

    const heading = line.match(/^#{1,6}\s+(.+)$/);
    if (heading) {
      const mapped = headingToType(heading[1]);
      inSourceSection = mapped === null;
      currentType = mapped || currentType;
      continue;
    }

    if (inSourceSection || SOURCE_LINE.test(line)) continue;

    if (/^[-*]\s+/.test(line)) {
      const text = line.replace(/^[-*]\s+/, '');
      if (looksLikeRenderedScaffolding(text)) continue;
      if (proseSummary && /\.\.\.?$/.test(text.trim())) continue;
      const sectionLike = cleanInlineMarkdown(text).replace(/\.+$/, '').trim();
      if (/^[\w &/-]+:$/.test(sectionLike)) {
        currentType = headingToType(sectionLike) || currentType;
        inSourceSection = false;
        continue;
      }
      const detectedType = detectBulletType(text, currentType);
      addChange(changes, {
        type: detectedType,
        text,
      });
    }
  }

  if (changes.length === 0) {
    if (proseSummary) {
      addChange(changes, { type: 'changed', text: proseSummary });
    } else {
      const paragraphs = body
        .split(/\n{2,}/)
        .map((paragraph) => cleanInlineMarkdown(paragraph))
        .filter(
          (paragraph) => paragraph && !looksLikeRenderedScaffolding(paragraph),
        );
      for (const paragraph of paragraphs.slice(0, 6)) {
        addChange(changes, { type: 'changed', text: paragraph });
      }
    }
  }

  if (changes.length === 0) {
    warnings.push('No meaningful release text found.');
  }

  const preferred = changes.find((change) => change.text);
  return {
    release,
    parser,
    summary:
      proseSummary || (preferred ? truncateSentence(preferred.text) : ''),
    changes,
    sourceRefs: dedupeSourceRefs(sourceRefs),
    warnings,
    isEmpty: changes.length === 0,
  };
}
