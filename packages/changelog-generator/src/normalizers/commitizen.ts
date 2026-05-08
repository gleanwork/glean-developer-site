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
  extractPrRef,
  isNoSignalText,
  releaseSourceRef,
  stripConventionalPrefix,
  truncateSentence,
} from './utils.js';

function mapHeading(heading: string): ChangeType | null {
  const normalized = cleanInlineMarkdown(heading).toLowerCase();
  if (normalized.includes('breaking')) return 'breaking';
  if (normalized === 'feat' || normalized.includes('feature')) return 'added';
  if (normalized === 'fix' || normalized.includes('bug')) return 'fixed';
  if (normalized.includes('deprecat')) return 'deprecated';
  if (normalized.includes('doc')) return 'docs';
  if (normalized.includes('refactor') || normalized.includes('perf')) {
    return 'changed';
  }
  if (normalized.includes('chore') || normalized.includes('internal')) {
    return 'internal';
  }
  return null;
}

function buildSummary(
  changes: NormalizedChange[],
  release: RawRelease,
): string {
  const preferred =
    changes.find((change) => change.type === 'breaking') ||
    changes.find((change) => !['docs', 'internal'].includes(change.type)) ||
    changes[0];
  if (!preferred) return '';
  if (preferred.type === 'breaking') {
    return truncateSentence(`Breaking change: ${preferred.text}`);
  }
  return truncateSentence(`${release.repo} ${release.tag}: ${preferred.text}`);
}

export function normalizeCommitizenRelease(
  release: RawRelease,
): NormalizedRelease {
  const releaseRef = releaseSourceRef(release);
  const sourceRefs: SourceRef[] = releaseRef ? [releaseRef] : [];
  const changes: NormalizedChange[] = [];
  const warnings: string[] = [];

  if (isNoSignalText(release.body)) {
    return {
      release,
      parser: 'commitizen',
      summary: '',
      changes,
      sourceRefs,
      warnings,
      isEmpty: true,
    };
  }

  let currentType: ChangeType | null = null;

  for (const rawLine of release.body.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;
    const heading = line.match(/^#{2,6}\s+(.+)$/);
    if (heading) {
      currentType = mapHeading(heading[1]);
      continue;
    }
    if (/^\*\*Full Changelog\*\*/i.test(line)) continue;
    if (!/^[-*]\s+/.test(line)) continue;

    const bullet = line.replace(/^[-*]\s+/, '').trim();
    const extracted = extractPrRef(bullet, release);
    const text = stripConventionalPrefix(extracted.text);
    const ref = extracted.ref;
    if (ref) sourceRefs.push(ref);
    addChange(changes, {
      type: currentType || 'changed',
      text,
      sourceRefs: ref ? [ref] : [],
    });
  }

  if (changes.length === 0) {
    const plain = cleanInlineMarkdown(
      release.body
        .split('\n')
        .filter((line) => !/^#{1,6}\s+/.test(line.trim()))
        .join(' '),
    );
    if (plain && !isNoSignalText(plain)) {
      addChange(changes, { type: 'changed', text: plain });
    } else {
      warnings.push('No structured Commitizen changes found.');
    }
  }

  return {
    release,
    parser: 'commitizen',
    summary: buildSummary(changes, release),
    changes,
    sourceRefs: dedupeSourceRefs(sourceRefs),
    warnings,
    isEmpty: changes.length === 0,
  };
}
