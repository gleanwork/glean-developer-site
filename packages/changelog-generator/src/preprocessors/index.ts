import type { RawRelease, PreProcessedRelease } from '../types.js';
import {
  isSpeakeasyFormat,
  parseSpeakeasyNotes,
  formatSpeakeasySummary,
} from './speakeasy.js';
import { stripBoilerplate, normalizeText } from './text-cleaner.js';

/**
 * Pre-process a release's notes into a format suitable for summarization.
 * Detects Speakeasy format and parses it deterministically.
 */
export function preProcessRelease(
  release: RawRelease,
  opts: { maxBullets?: number; maxChars?: number } = {},
): PreProcessedRelease {
  const body = release.body || '';

  if (isSpeakeasyFormat(body)) {
    const structuredChanges = parseSpeakeasyNotes(body);
    const cleanedText =
      structuredChanges.length > 0
        ? formatSpeakeasySummary(structuredChanges, opts)
        : normalizeText(stripBoilerplate(body));

    return {
      release,
      format: 'speakeasy',
      structuredChanges,
      cleanedText,
    };
  }

  return {
    release,
    format: 'plain',
    structuredChanges: [],
    cleanedText: normalizeText(stripBoilerplate(body)),
  };
}

export {
  isSpeakeasyFormat,
  parseSpeakeasyNotes,
  formatSpeakeasySummary,
} from './speakeasy.js';
export { stripBoilerplate, normalizeText } from './text-cleaner.js';
