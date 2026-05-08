import type {
  ChangeType,
  NormalizedChange,
  NormalizedRelease,
  RawRelease,
  SourceRef,
} from '../types.js';
import {
  addChange,
  changeTextWithContext,
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
  if (normalized.includes('bug')) return 'fixed';
  if (normalized.includes('fix')) return 'fixed';
  if (normalized.includes('deprecation')) return 'deprecated';
  if (normalized.includes('documentation')) return 'docs';
  if (normalized.includes('internal')) return 'internal';
  if (normalized.includes('security')) return 'fixed';
  if (normalized.includes('enhancement')) return 'added';
  return null;
}

function isPackageContext(line: string): boolean {
  const trimmed = line.trim();
  return /^[-*]\s+`[^`]+`/.test(trimmed) && !trimmed.includes('[#');
}

function packageContext(line: string): string {
  return cleanInlineMarkdown(line.replace(/^[-*]\s+/, ''));
}

function parseBullet(
  line: string,
  release: RawRelease,
): { text: string; ref: SourceRef | null } | null {
  const bullet = line
    .trim()
    .replace(/^[-*]\s+/, '')
    .trim();
  if (!bullet) return null;
  const extracted = extractPrRef(bullet, release);
  const text = stripConventionalPrefix(extracted.text);
  return { text, ref: extracted.ref };
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

export function normalizeLernaChangelogRelease(
  release: RawRelease,
): NormalizedRelease {
  const releaseRef = releaseSourceRef(release);
  const sourceRefs: SourceRef[] = releaseRef ? [releaseRef] : [];
  const changes: NormalizedChange[] = [];
  const warnings: string[] = [];

  if (
    isNoSignalText(release.body) ||
    cleanInlineMarkdown(release.body) === `${release.repo} ${release.tag}`
  ) {
    return {
      release,
      parser: 'lerna-changelog',
      summary: '',
      changes,
      sourceRefs,
      warnings,
      isEmpty: true,
    };
  }

  let currentType: ChangeType | null = null;
  let currentContext = '';
  let inCommitters = false;

  for (const rawLine of release.body.split('\n')) {
    const line = rawLine.trimEnd();
    const heading = line.match(/^#{2,6}\s+(.+)$/);
    if (heading) {
      inCommitters = /committers/i.test(heading[1]);
      currentType = inCommitters ? null : mapHeading(heading[1]);
      currentContext = '';
      continue;
    }

    if (inCommitters || !line.trim()) continue;
    if (isPackageContext(line)) {
      currentContext = packageContext(line);
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      const parsed = parseBullet(line, release);
      if (!parsed) continue;
      const type =
        currentType ||
        (/!:/i.test(parsed.text) || /^breaking/i.test(parsed.text)
          ? 'breaking'
          : 'changed');
      const text = changeTextWithContext(parsed.text, currentContext);
      const refs = parsed.ref ? [parsed.ref] : [];
      if (parsed.ref) sourceRefs.push(parsed.ref);
      addChange(changes, { type, text, sourceRefs: refs });
      continue;
    }

    const text = cleanInlineMarkdown(line);
    if (text && !/^#/.test(text)) {
      addChange(changes, {
        type: currentType || 'changed',
        text,
      });
    }
  }

  if (changes.length === 0) {
    warnings.push('No structured lerna-changelog changes found.');
  }

  return {
    release,
    parser: 'lerna-changelog',
    summary: buildSummary(changes, release),
    changes,
    sourceRefs: dedupeSourceRefs(sourceRefs),
    warnings,
    isEmpty: changes.length === 0,
  };
}
