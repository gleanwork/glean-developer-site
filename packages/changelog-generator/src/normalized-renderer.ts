import type {
  ChangeType,
  NormalizedChange,
  NormalizedRelease,
  SourceRef,
} from './types.js';
import {
  CHANGE_TYPE_ORDER,
  dedupeSourceRefs,
  stripEmoji,
  truncateSentence,
} from './normalizers/utils.js';

function sortChanges(changes: NormalizedChange[]): NormalizedChange[] {
  return [...changes].sort((a, b) => {
    const aIdx = CHANGE_TYPE_ORDER.indexOf(a.type);
    const bIdx = CHANGE_TYPE_ORDER.indexOf(b.type);
    return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
  });
}

function sectionTitle(type: ChangeType): string {
  if (type === 'breaking') return 'Breaking Changes';
  if (type === 'deprecated') return 'Deprecated';
  return 'Changes';
}

function cleanLine(text: string): string {
  return stripEmoji(text).replace(/\s+/g, ' ').trim();
}

function renderChangeList(changes: NormalizedChange[]): string {
  return changes.map((change) => `- ${cleanLine(change.text)}`).join('\n');
}

function ensureActionSentence(text: string): string {
  const cleaned = cleanLine(text).replace(/[.!?]+$/, '');
  if (!cleaned) return '';
  return `${cleaned}.`;
}

function endpointLabel(method: string | undefined, path: string): string {
  const normalizedPath = path.replace(/[`.,;]+$/g, '');
  return method ? `${method.toUpperCase()} ${normalizedPath}` : normalizedPath;
}

function actionForChange(change: NormalizedChange): string | null {
  const text = cleanLine(change.text);
  const lower = text.toLowerCase();

  const removedEndpoint = text.match(
    /\bremoved endpoint:?\s+(?:(GET|POST|PUT|PATCH|DELETE)\s+)?(`?\/[^`\s.,;]+`?)/i,
  );
  if (removedEndpoint) {
    return ensureActionSentence(
      `Update callers to stop using ${endpointLabel(removedEndpoint[1], removedEndpoint[2])}`,
    );
  }

  const removedField = text.match(/^Removed `([^`]+)` from `([^`]+)`/i);
  if (removedField) {
    return ensureActionSentence(
      `Update callers of \`${removedField[2]}\` to stop using \`${removedField[1]}\``,
    );
  }

  const nodeVersion = text.match(/\bnode\.?js\s+(\d+(?:\.\d+)*)/i);
  if (nodeVersion) {
    return ensureActionSentence(
      `Verify your runtime uses Node.js ${nodeVersion[1]} or later`,
    );
  }

  const goVersion = text.match(
    /\bminimum\s+go\s+version\s+(?:to\s+)?(\d+(?:\.\d+)*)/i,
  );
  if (goVersion) {
    return ensureActionSentence(
      `Verify your Go toolchain uses ${goVersion[1]} or later`,
    );
  }

  const pythonVersion = text.match(/\brequires?\s+python\s+(\d+(?:\.\d+)*)/i);
  if (pythonVersion) {
    return ensureActionSentence(
      `Verify your runtime uses Python ${pythonVersion[1]} or later`,
    );
  }

  if (/\bimport paths? (?:has|have )?changed\b/i.test(text)) {
    return ensureActionSentence('Update imports to use the new paths');
  }

  if (/\brequest body\b/i.test(text)) {
    return ensureActionSentence(
      'Update request body handling before upgrading',
    );
  }

  if (/\bmigrat(?:e|ed|ion)\b/i.test(text)) {
    return ensureActionSentence('Follow the migration notes before upgrading');
  }

  if (/\boauth\b/i.test(text)) {
    const hasUpgradeCue =
      /\b(config|configuration|setup|client|scope|token|callback|redirect|permission|require|required|must)\b/i.test(
        text,
      );
    if (hasUpgradeCue) {
      return ensureActionSentence(
        'Review OAuth configuration before upgrading',
      );
    }
  }

  if (change.type === 'deprecated' || /\bdeprecat/i.test(lower)) {
    const target =
      text.match(/^Deprecated\s+(.+)$/i)?.[1] ||
      text.match(/\bdeprecated\s+(.+)$/i)?.[1] ||
      'deprecated behavior';
    return ensureActionSentence(`Plan migration away from ${target}`);
  }

  if (change.type === 'breaking') {
    if (/^breaking:/i.test(text)) return null;
    return ensureActionSentence(
      `Review this breaking change before upgrading: ${text}`,
    );
  }

  return null;
}

function deriveActionItems(changes: NormalizedChange[]): string[] {
  const seen = new Set<string>();
  const actionItems: string[] = [];

  for (const change of changes) {
    const action = actionForChange(change);
    if (!action) continue;
    const key = action.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    actionItems.push(action);
  }

  return actionItems;
}

function collectSourceRefs(normalized: NormalizedRelease): SourceRef[] {
  return dedupeSourceRefs([
    ...normalized.sourceRefs,
    ...normalized.changes.flatMap((change) => change.sourceRefs || []),
  ]);
}

function renderSources(refs: SourceRef[]): string {
  if (refs.length === 0) return '';
  return [
    '## Source',
    '',
    ...refs.map((ref) => `- [${ref.label}](${ref.url})`),
  ].join('\n');
}

export function renderNormalizedRelease(normalized: NormalizedRelease): {
  summary: string;
  detailedContent: string;
} {
  const summary = truncateSentence(
    normalized.summary ||
      normalized.changes.find((change) => change.type !== 'internal')?.text ||
      `${normalized.release.repo} ${normalized.release.tag} includes release updates.`,
  );

  const regularChanges = sortChanges(
    normalized.changes.filter(
      (change) => change.type !== 'breaking' && change.type !== 'deprecated',
    ),
  );
  const deprecatedChanges = normalized.changes.filter(
    (change) => change.type === 'deprecated',
  );
  const breakingChanges = normalized.changes.filter(
    (change) => change.type === 'breaking',
  );
  const actionItems = deriveActionItems([
    ...breakingChanges,
    ...deprecatedChanges,
    ...regularChanges.filter(
      (change) => change.type !== 'docs' && change.type !== 'internal',
    ),
  ]);

  const sections: string[] = [];
  if (actionItems.length > 0) {
    sections.push(
      [
        '## Action Required',
        '',
        actionItems.map((item) => `- ${item}`).join('\n'),
      ].join('\n'),
    );
  }

  if (regularChanges.length > 0) {
    sections.push(
      [
        `## ${sectionTitle('changed')}`,
        '',
        renderChangeList(regularChanges),
      ].join('\n'),
    );
  } else if (breakingChanges.length > 0 || deprecatedChanges.length > 0) {
    sections.push(
      [
        `## ${sectionTitle('changed')}`,
        '',
        '- This release only includes breaking or deprecated changes.',
      ].join('\n'),
    );
  }
  if (deprecatedChanges.length > 0) {
    sections.push(
      [
        `## ${sectionTitle('deprecated')}`,
        '',
        renderChangeList(deprecatedChanges),
      ].join('\n'),
    );
  }
  if (breakingChanges.length > 0) {
    sections.push(
      [
        `## ${sectionTitle('breaking')}`,
        '',
        renderChangeList(breakingChanges),
      ].join('\n'),
    );
  }

  const sourceSection = renderSources(collectSourceRefs(normalized));
  if (sourceSection) sections.push(sourceSection);

  return {
    summary: cleanLine(summary),
    detailedContent: sections.join('\n\n').trim(),
  };
}
