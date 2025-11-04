import { Glean } from '@gleanwork/api-client';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-var-requires
const dbg: any = require('debug');
const dbgSum = dbg('changelog:sum');

function stripBoilerplate(raw: string): string {
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

function normalizeText(text: string): string {
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

function heuristicSummarize(
  text: string,
  opts: { maxChars: number; maxBullets: number },
): string {
  const cleaned = normalizeText(stripBoilerplate(text));
  const lines = cleaned
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  let intro = '';
  for (const l of lines) {
    if (!/^[-#]/.test(l)) {
      intro = l.replace(/\s+/g, ' ').trim();
      break;
    }
  }
  if (!intro && lines.length > 0) intro = lines[0];
  if (!intro) intro = 'Maintenance updates and improvements.';
  if (!/[.!?]$/.test(intro)) intro += '.';
  if (intro.length > opts.maxChars) {
    intro =
      intro
        .slice(0, opts.maxChars)
        .replace(/\s+\S*$/, '')
        .trim() + '...';
  }

  const bullets: Array<string> = [];
  const maxBullets = Math.max(0, Math.min(10, opts.maxBullets || 0));
  if (maxBullets > 0) {
    for (const l of lines) {
      if (l.startsWith('- ')) {
        const b = l.slice(2).trim();
        if (b && /[a-zA-Z]/.test(b)) bullets.push(b);
      }
      if (bullets.length >= maxBullets) break;
    }

    if (bullets.length === 0) {
      const sentences = cleaned
        .split(/[.!?]\s+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 20 && /[a-zA-Z]/.test(s));
      for (const s of sentences.slice(0, maxBullets)) bullets.push(s + '.');
    }
  }

  return bullets.length > 0
    ? [intro, ...bullets.map((b) => `- ${b}`)].join('\n')
    : intro;
}

function hasPlaceholderText(text: string): boolean {
  const placeholderPatterns = [
    /\bhas changed to\s*\./,
    /\bresponse of\s*\./,
    /\bis now included in\s+within\s+the\s+response/,
    /\bthe field is now included\s+in\s+within/,
    /\bfor\s+has changed to\s*\./,
    /\s+\.\s+/,
    /\bthe\s+field\s+is\s+now\s+included\s+in\s+within/,
    /\bresponse\s+type\s+for\s+has\s+changed/,
  ];

  return placeholderPatterns.some((pattern) => pattern.test(text));
}

function stripMetaCommentary(text: string): string {
  let t = text;

  t = t.replace(
    /^Summarizing\s+the\s+provided\s+release\s+notes[^\n.]*(into|for)?[^\n.]*(\.|\n)/gi,
    '',
  );
  t = t.replace(/^This\s+release\s+note\s+summarizes[^\n.]*(\.|\n)/gi, '');
  t = t.replace(/^Here\s+is\s+(a|the)\s+summary[^\n:]*(:|\.|\n)/gi, '');
  t = t.replace(/^In\s+summary[^\n:]*(:|\.|\n)/gi, '');
  t = t.replace(/for\s+clarity\s+and\s+conciseness\.?\s*/gi, ' ');
  t = t.replace(/into\s+a\s+concise\s+user-facing\s+summary\.?\s*/gi, ' ');

  return t.trim();
}

async function summarizeWithGlean(
  text: string,
  opts: { maxChars: number; category?: string; hints?: Array<string> },
): Promise<string | null> {
  const apiToken = process.env.GLEAN_API_TOKEN;
  const instance = process.env.GLEAN_INSTANCE;

  if (!apiToken || !instance) {
    dbgSum(
      'summarize:skipping LLM (missing GLEAN_API_TOKEN or GLEAN_INSTANCE)',
    );
    return null;
  }

  try {
    const cleaned = stripBoilerplate(text);
    dbgSum(
      'summarize:start category=%s hints=%d textLen=%d',
      opts.category || 'General',
      (opts.hints || []).length,
      cleaned.length,
    );
    const client = new Glean({ apiToken, instance });
    const prompt = [
      `Create a changelog entry from the release notes below.`,
      ``,
      `CRITICAL RULES:`,
      `1. Start IMMEDIATELY with the actual content - NO preamble, NO "Here is", NO "Summarizing", NO meta-commentary`,
      `2. First line MUST be a complete sentence stating what changed (max ${opts.maxChars} chars)`,
      `3. Follow with up to 3 bullets starting with "- "`,
      `4. Use ONLY information from the release notes - NO placeholders, NO template text`,
      `5. If you see incomplete template text like "The field is now included in within", skip that detail entirely`,
      `6. NO URLs, NO PR numbers, NO usernames like (@someone), NO "Generated with Speakeasy"`,
      ``,
      `Category: ${opts.category || 'General'}`,
      `Focus: ${(opts.hints || []).join('; ') || 'Key changes affecting developers'}`,
      ``,
      `Release notes:`,
      `${cleaned}`,
    ].join('\n');

    const res = await client.client.chat.create({
      messages: [{ fragments: [{ text: prompt }] }],
    });
    dbgSum('summarize:response received');
    const parts: Array<string> = [];
    const msgs = (res as any)?.messages || [];

    for (const m of msgs) {
      const frs = m?.fragments || [];
      for (const f of frs) {
        if (f?.text) parts.push(String(f.text));
      }
    }

    let joined = normalizeText(parts.join(' ').trim());
    joined = stripMetaCommentary(joined);

    joined = joined
      .replace(/https?:\/\/\S+/g, ' ')
      .replace(/Generated\s+(with|by)\s+Speakeasy[^\n]*/gi, ' ')
      .replace(/\(#[0-9]+\)/g, ' ')
      .replace(/\(@[a-z0-9_-]+\)/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!joined || hasPlaceholderText(joined)) {
      dbgSum('summarize:rejected (empty or has placeholders)');
      return null;
    }

    dbgSum('summarize:joined len=%d', joined.length);
    return joined.length <= opts.maxChars
      ? joined
      : joined
          .slice(0, opts.maxChars)
          .replace(/\s+\S*$/, '')
          .trim() + '...';
  } catch (err) {
    dbgSum('summarize:error %o', err);
    return null;
  }
}

export async function summarizeRelease(
  text: string,
  opts: {
    mode: 'off' | 'heuristic' | 'llm';
    maxBullets: number;
    maxChars: number;
    model?: string;
    category?: string;
    hints?: Array<string>;
  },
): Promise<string> {
  if (opts.mode === 'llm') {
    const llm = await summarizeWithGlean(text, {
      maxChars: opts.maxChars,
      category: opts.category,
      hints: opts.hints,
    });
    if (llm) return llm;
  }
  dbgSum('summarize:fallback heuristic');
  return heuristicSummarize(text, {
    maxChars: opts.maxChars,
    maxBullets: opts.maxBullets,
  });
}
