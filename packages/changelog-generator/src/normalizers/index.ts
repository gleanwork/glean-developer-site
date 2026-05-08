import type { NormalizedRelease, RawRelease, ReleaseParser } from '../types.js';
import { isSpeakeasyFormat } from '../preprocessors/speakeasy.js';
import { normalizeCommitizenRelease } from './commitizen.js';
import { normalizeLernaChangelogRelease } from './lerna-changelog.js';
import { normalizePlainRelease } from './plain.js';
import { normalizeSpeakeasyRelease } from './speakeasy.js';

function looksLikeLernaChangelog(body: string): boolean {
  return (
    /^####\s+/m.test(body) ||
    /\[#\d+\]\(https:\/\/github\.com\/[^)]+\/pull\/\d+\)/.test(body)
  );
}

function looksLikeCommitizen(body: string): boolean {
  return /^###\s+(Feat|Fix|Refactor|Docs|Chore|Perf|Breaking)/im.test(body);
}

export function normalizeRelease(
  release: RawRelease,
  parser: ReleaseParser,
): NormalizedRelease {
  if (parser === 'speakeasy') return normalizeSpeakeasyRelease(release);
  if (parser === 'commitizen') return normalizeCommitizenRelease(release);
  if (parser === 'lerna-changelog') {
    return normalizeLernaChangelogRelease(release);
  }
  if (parser === 'openapi') return normalizePlainRelease(release, 'openapi');
  if (parser === 'legacy') return normalizePlainRelease(release, 'legacy');
  if (parser === 'plain') return normalizePlainRelease(release);

  if (isSpeakeasyFormat(release.body))
    return normalizeSpeakeasyRelease(release);
  if (looksLikeLernaChangelog(release.body)) {
    return normalizeLernaChangelogRelease(release);
  }
  if (looksLikeCommitizen(release.body))
    return normalizeCommitizenRelease(release);
  return normalizePlainRelease(release);
}

export { stripEmoji } from './utils.js';
