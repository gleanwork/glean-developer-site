/**
 * Text cleaning utilities for changelog release notes.
 * Extracted from summarizer.ts for reuse across the pipeline.
 */

export function stripBoilerplate(raw: string): string {
  let t = raw;

  t = t.replace(
    /Generated\s+with\s+\[?Speakeasy CLI[^\]\n]*\]?\([^)]*\)/gi,
    ' ',
  );
  t = t.replace(/Generated\s+by\s+Speakeasy\s+CLI[^\n]*/gi, ' ');
  t = t.replace(/Publishing\s+Completed/gi, ' ');

  t = t.replace(/https?:\/\/central\.sonatype\.com\/artifact\/[\w./-]+/gi, ' ');
  t = t.replace(/https?:\/\/pypi\.org\/project\/[\w./-]+/gi, ' ');
  t = t.replace(/https?:\/\/www\.npmjs\.com\/package\/[\w./-]+/gi, ' ');

  // Unwrap markdown links to just their text
  t = t.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');

  t = t.replace(
    /\b(Java|Python|Typescript|Go)\s+SDK\s+Changes\s+Detected:?/gi,
    ' ',
  );
  t = t.replace(
    /##+\s+(Java|Python|Typescript|Go)\s+SDK\s+Changes[^\n]*/gi,
    ' ',
  );

  t = t.replace(/\(#[0-9]+\)/g, ' ');
  t = t.replace(/\(@[a-z0-9_-]+\)/gi, ' ');

  // Fix noisy token sequences like "* , , *"
  t = t.replace(/\*\s*,\s*,\s*\*/g, ' ');
  t = t.replace(/\*\s*,\s*/g, ' ');

  // Normalize bullets to leading '- ' or '* '
  t = t.replace(/^\s*[•·]\s+/gm, '- ');
  t = t.replace(/^\s*\*\s+/gm, '- ');

  // Trim repeated spaces and stray punctuation
  t = t.replace(/\s{2,}/g, ' ');
  t = t.replace(/\s+([.,;:])/g, '$1');

  return t;
}

export function normalizeText(text: string): string {
  let t = text.replace(/```[\s\S]*?```/g, ' ');
  t = t.replace(/`[^`]*`/g, ' ');
  t = t.replace(/<[^>]+>/g, ' ');
  t = t.replace(/^#+\s+.*$/gm, ' ');
  t = t.replace(/\r/g, '');
  t = t.replace(/[\t\f\v]/g, ' ');
  t = t.replace(/\s+\n/g, '\n');
  t = t.replace(/\n{3,}/g, '\n\n');
  return t.trim();
}
