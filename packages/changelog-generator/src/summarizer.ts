import { Glean } from '@gleanwork/api-client';
import { createRequire } from 'node:module';
import { preProcessRelease } from './preprocessors/index.js';
import {
  stripBoilerplate,
  normalizeText,
} from './preprocessors/text-cleaner.js';
import { validateSummary } from './validators.js';
import type { RawRelease, SummarizedRelease } from './types.js';

const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-var-requires
const dbg: any = require('debug');
const dbgSum = dbg('changelog:sum');

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

  const alphaOnly = (intro || '').replace(/[^a-zA-Z]/g, '');
  if (!intro || alphaOnly.length < 10) {
    intro = 'Maintenance updates and improvements.';
  }
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
        const bAlpha = b.replace(/[^a-zA-Z]/g, '');
        if (b && bAlpha.length >= 10) bullets.push(b);
      }
      if (bullets.length >= maxBullets) break;
    }

    if (bullets.length === 0) {
      const sentences = cleaned
        .split(/[.!?]\s+/)
        .map((s) => s.trim())
        .filter((s) => {
          const sAlpha = s.replace(/[^a-zA-Z]/g, '');
          return s.length > 20 && sAlpha.length >= 10;
        });
      for (const s of sentences.slice(0, maxBullets)) bullets.push(s + '.');
    }
  }

  return bullets.length > 0
    ? [intro, ...bullets.map((b) => `- ${b}`)].join('\n')
    : intro;
}

async function summarizeWithGlean(
  text: string,
  opts: { maxChars: number; category?: string; hints?: Array<string> },
): Promise<string | null> {
  const apiToken = process.env.GLEAN_API_TOKEN;
  const serverURL = process.env.GLEAN_SERVER_URL;
  const instance = process.env.GLEAN_INSTANCE;

  if (!apiToken || (!serverURL && !instance)) {
    throw new Error(
      'LLM summarization requires GLEAN_API_TOKEN and either GLEAN_SERVER_URL or GLEAN_INSTANCE to be set.',
    );
  }

  try {
    const cleaned = stripBoilerplate(text);
    dbgSum(
      'summarize:start category=%s hints=%d textLen=%d',
      opts.category || 'General',
      (opts.hints || []).length,
      cleaned.length,
    );
    const clientOpts: Record<string, string> = { apiToken };
    if (serverURL) {
      clientOpts.serverURL = serverURL;
    } else {
      clientOpts.instance = instance!;
    }
    const client = new Glean(clientOpts);

    const systemInstructions = [
      `You are a changelog entry generator. Output ONLY the changelog content.`,
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
    ].join('\n');

    const userContent = [
      `Create a changelog entry from these release notes:`,
      ``,
      `${cleaned}`,
    ].join('\n');

    const res = await client.client.chat.create({
      messages: [
        {
          messageType: 'CONTEXT',
          fragments: [{ text: systemInstructions }],
        },
        {
          messageType: 'CONTENT',
          fragments: [{ text: userContent }],
        },
      ],
      agentConfig: {
        toolSets: {
          enableCompanyTools: false,
          enableWebSearch: false,
        },
      },
    });
    dbgSum('summarize:response received');
    const parts: Array<string> = [];
    const msgs = (res as any)?.messages || [];

    for (const m of msgs) {
      if (m?.messageType && m.messageType !== 'CONTENT') {
        dbgSum('summarize:skip message type=%s', m.messageType);
        continue;
      }

      const frs = m?.fragments || [];
      for (const f of frs) {
        if (f?.text) parts.push(String(f.text));
      }
    }

    let joined = normalizeText(parts.join(' ').trim());

    joined = joined
      .replace(/https?:\/\/\S+/g, ' ')
      .replace(/Generated\s+(with|by)\s+Speakeasy[^\n]*/gi, ' ')
      .replace(/\(#[0-9]+\)/g, ' ')
      .replace(/\(@[a-z0-9_-]+\)/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!joined) {
      dbgSum('summarize:rejected (empty response)');
      return null;
    }

    // Validate LLM output using the centralized validator
    const validation = validateSummary(joined, { maxChars: opts.maxChars });
    if (!validation.valid) {
      dbgSum('summarize:rejected (%s)', validation.reason);
      return null;
    }

    dbgSum('summarize:accepted len=%d', joined.length);
    return joined;
  } catch (err: any) {
    const message = err?.message || String(err);
    throw new Error(`Glean API chat request failed: ${message}`);
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
    release?: RawRelease;
  },
): Promise<SummarizedRelease> {
  // If we have a RawRelease, try the pre-processor first (handles Speakeasy deterministically)
  if (opts.release) {
    const preProcessed = preProcessRelease(opts.release, {
      maxBullets: opts.maxBullets,
      maxChars: opts.maxChars,
    });

    if (preProcessed.format === 'speakeasy') {
      dbgSum(
        'summarize:using speakeasy-deterministic for %s %s',
        opts.release.repo,
        opts.release.tag,
      );
      return {
        release: opts.release,
        summary: preProcessed.cleanedText,
        strategy: 'speakeasy-deterministic',
      };
    }
  }

  // LLM path
  if (opts.mode === 'llm') {
    const llm = await summarizeWithGlean(text, {
      maxChars: opts.maxChars,
      category: opts.category,
      hints: opts.hints,
    });
    if (llm) {
      return {
        release: opts.release ?? {
          owner: '',
          repo: '',
          tag: '',
          url: '',
          publishedAt: '',
          body: text,
          category: opts.category || '',
        },
        summary: llm,
        strategy: 'llm',
      };
    }

    throw new Error(
      'LLM summarization failed — check that GLEAN_API_TOKEN is valid and not expired. ' +
        'Set summarization.mode to "heuristic" in config.yml to use the fallback summarizer.',
    );
  }

  // Heuristic path
  if (opts.mode === 'heuristic') {
    const summary = heuristicSummarize(text, {
      maxChars: opts.maxChars,
      maxBullets: opts.maxBullets,
    });
    return {
      release: opts.release ?? {
        owner: '',
        repo: '',
        tag: '',
        url: '',
        publishedAt: '',
        body: text,
        category: opts.category || '',
      },
      summary,
      strategy: 'heuristic',
    };
  }

  // Off mode
  return {
    release: opts.release ?? {
      owner: '',
      repo: '',
      tag: '',
      url: '',
      publishedAt: '',
      body: text,
      category: opts.category || '',
    },
    summary: 'Maintenance updates and improvements.',
    strategy: 'fallback',
  };
}
