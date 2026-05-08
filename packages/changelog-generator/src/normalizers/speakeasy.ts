import type {
  ChangeType,
  NormalizedChange,
  NormalizedRelease,
  RawRelease,
} from '../types.js';
import {
  isSpeakeasyFormat,
  parseSpeakeasyNotes,
} from '../preprocessors/speakeasy.js';
import {
  addChange,
  dedupeSourceRefs,
  releaseSourceRef,
  truncateSentence,
} from './utils.js';

function methodName(method: string): string {
  return method.replace(/^[Gg]lean\./, '').toLowerCase();
}

function changeType(action: string): ChangeType {
  if (action === 'added') return 'added';
  if (action === 'removed') return 'breaking';
  if (action === 'deprecated') return 'deprecated';
  return 'changed';
}

function describe(action: string, field: string, method: string): string {
  const target = `\`${field}\``;
  const api = `\`${methodName(method)}\``;
  if (action === 'added') return `Added ${target} to ${api}`;
  if (action === 'removed') return `Removed ${target} from ${api}`;
  if (action === 'deprecated') return `Deprecated ${target} on ${api}`;
  return `Changed ${target} on ${api}`;
}

function buildSummary(
  changes: NormalizedChange[],
  release: RawRelease,
): string {
  if (changes.length === 0) return '';
  const counts = new Map<ChangeType, number>();
  for (const change of changes) {
    counts.set(change.type, (counts.get(change.type) || 0) + 1);
  }

  const parts: string[] = [];
  const added = counts.get('added') || 0;
  const changed = counts.get('changed') || 0;
  const breaking = counts.get('breaking') || 0;
  const deprecated = counts.get('deprecated') || 0;

  if (breaking)
    parts.push(`${breaking} breaking removal${breaking > 1 ? 's' : ''}`);
  if (added) parts.push(`${added} addition${added > 1 ? 's' : ''}`);
  if (changed) parts.push(`${changed} change${changed > 1 ? 's' : ''}`);
  if (deprecated)
    parts.push(`${deprecated} deprecation${deprecated > 1 ? 's' : ''}`);

  return truncateSentence(
    `${release.repo} ${release.tag} includes ${parts.join(', ')}`,
  );
}

export function normalizeSpeakeasyRelease(
  release: RawRelease,
): NormalizedRelease {
  const refs = [releaseSourceRef(release)].filter(Boolean) as NonNullable<
    ReturnType<typeof releaseSourceRef>
  >[];

  if (!isSpeakeasyFormat(release.body)) {
    return {
      release,
      parser: 'speakeasy',
      summary: '',
      changes: [],
      sourceRefs: refs,
      warnings: ['Release body is not in Speakeasy format.'],
      isEmpty: true,
    };
  }

  const parsed = parseSpeakeasyNotes(release.body);
  const changes: NormalizedChange[] = [];
  for (const item of parsed) {
    addChange(changes, {
      type: changeType(item.action),
      text: describe(item.action, item.field, item.method),
    });
  }

  return {
    release,
    parser: 'speakeasy',
    summary: buildSummary(changes, release),
    changes,
    sourceRefs: dedupeSourceRefs(refs),
    warnings: [],
    isEmpty: changes.length === 0,
  };
}
