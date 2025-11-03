import type { Endpoints } from '@octokit/types';
import type { Octokit } from 'octokit';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { createRequire } from 'node:module';
import yaml from 'js-yaml';
import { runOpenApiChanges } from './openapi-changes-runner.js';

const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-var-requires
const dbg: any = require('debug');
const dbgOpenApi = dbg('changelog:openapi');

export type OpenApiConfig = {
	enabled: boolean;
	repo: { owner: string; repo: string };
	paths: Array<string>;
	lookbackDays: number;
	diffEnabled?: boolean;
	diffBin?: string;
	diffEngine?: 'pb33f' | 'none';
};

export type OpenApiIngestResult = {
	files: Array<{ path: string; content: string; commitMessage: string }>;
	latestSha: string | null;
	report: { days: number; commits: number };
};

type CommitDetail = {
	sha: string;
	message: string;
	date: string;
	files: Set<string>;
};

function toIsoStartOfDay(date: Date): string {
	const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0));
	return d.toISOString();
}

function minusDaysUtc(days: number): Date {
	const now = new Date();
	return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - days));
}

function formatDay(d: Date): string {
	const y = d.getUTCFullYear();
	const m = String(d.getUTCMonth() + 1).padStart(2, '0');
	const day = String(d.getUTCDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

export async function listCommitsForPath(
	octokit: Octokit,
	owner: string,
	repo: string,
	path: string,
	sinceIso?: string,
): Promise<Endpoints['GET /repos/{owner}/{repo}/commits']['response']['data']> {
	const res = await octokit.rest.repos.listCommits({ owner, repo, path, since: sinceIso, per_page: 100 });
	return res.data;
}

async function getCommitDetails(
	octokit: Octokit,
	owner: string,
	repo: string,
	sha: string,
) {
	const res = await octokit.rest.repos.getCommit({ owner, repo, ref: sha });
	return res.data;
}

async function fetchFileContent(
	octokit: Octokit,
	owner: string,
	repo: string,
	filePath: string,
	ref: string,
): Promise<string | null> {
	try {
		const res = await octokit.rest.repos.getContent({ owner, repo, path: filePath, ref });
		if (Array.isArray(res.data) || res.data.type !== 'file' || !res.data.content) return null;
		return Buffer.from(res.data.content, 'base64').toString('utf8');
	} catch (err) {
		dbgOpenApi('content: error reading %s@%s: %o', filePath, ref, err);
		return null;
	}
}

function hasMeaningfulChanges(diff: any): boolean {
	if (!diff) return false;
	if (Array.isArray(diff?.changed) && diff.changed.length > 0) return true;
	if (Array.isArray(diff?.added) && diff.added.length > 0) return true;
	if (Array.isArray(diff?.removed) && diff.removed.length > 0) return true;
	if (diff?.paths || diff?.components || diff?.schemas) return true;
	const keys = Object.keys(diff || {});
	return keys.length > 0;
}

export async function ingestOpenApiCommits(opts: {
	octokit: Octokit;
	cfg: OpenApiConfig;
	latestLocalEntryDate: string | null;
	cachedSha: string | null;
	buildEntry: (day: string, commits: Array<{ sha: string; message: string; files: Array<string> }>) => { path: string; content: string; commitMessage: string };
}): Promise<OpenApiIngestResult> {
	if (!opts.cfg.enabled) return { files: [], latestSha: null, report: { days: 0, commits: 0 } };

	const { owner, repo } = opts.cfg.repo;

	let sinceIso: string | undefined = undefined;
	let currentCachedSha: string | null = opts.cachedSha;

	const cacheFilePath = path.join(process.cwd(), 'packages', 'changelog-generator', '.gleanwork-open-api-last-changed');
	if (fs.existsSync(cacheFilePath)) {
		try {
			currentCachedSha = fs.readFileSync(cacheFilePath, 'utf-8').trim();
			dbgOpenApi('ingest: cached sha %s', currentCachedSha);
		} catch {}
	}

	if (currentCachedSha) {
		try {
			const detail = await getCommitDetails(opts.octokit, owner, repo, currentCachedSha);
			const dateStr = detail.commit?.committer?.date || detail.commit?.author?.date;
			if (dateStr) {
				const d = new Date(dateStr);
				const next = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1));
				sinceIso = toIsoStartOfDay(next);
			}
		} catch {}
	}
	if (!sinceIso) {
		if (opts.latestLocalEntryDate) {
			const d = new Date(opts.latestLocalEntryDate + 'T00:00:00Z');
			const next = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1));
			sinceIso = toIsoStartOfDay(next);
		} else {
			sinceIso = toIsoStartOfDay(minusDaysUtc(opts.cfg.lookbackDays));
		}
	}

    const commitMap = new Map<string, CommitDetail>();
    const commitBullets = new Map<string, Array<string>>();
	for (const p of opts.cfg.paths) {
		const commits = await listCommitsForPath(opts.octokit, owner, repo, p, sinceIso);
		for (const c of commits) {
			const sha = c.sha;
			const msg = (c.commit?.message || '').split('\n')[0];
			const dateStr = c.commit?.committer?.date || c.commit?.author?.date || '';
			const day = dateStr ? formatDay(new Date(dateStr)) : '';
			if (!sha || !day) continue;
			const prev = commitMap.get(sha);
			if (!prev) commitMap.set(sha, { sha, message: msg, date: day, files: new Set([p]) });
			else prev.files.add(p);
		}
	}

	const engine = opts.cfg.diffEngine ?? 'pb33f';
	const isVitest = !!process.env.VITEST_WORKER_ID;
	const useDiff = opts.cfg.diffEnabled !== false && engine === 'pb33f' && !isVitest;
    if (useDiff) {
		for (const [sha, rec] of Array.from(commitMap.entries())) {
			try {
				const detail = await getCommitDetails(opts.octokit, owner, repo, sha);
				const parentSha = detail.parents?.[0]?.sha;
				if (!parentSha) continue;
                let meaningful = false;
                const bullets: Array<string> = [];
                for (const f of Array.from(rec.files)) {
					const baseContent = await fetchFileContent(opts.octokit, owner, repo, f, parentSha);
					const headContent = await fetchFileContent(opts.octokit, owner, repo, f, sha);
					if (!baseContent || !headContent) continue;
					let diff: any = null;
					try {
						diff = runOpenApiChanges(baseContent, headContent, opts.cfg.diffBin);
					} catch (e) {
						dbgOpenApi('diff: runner error for %s file %s %o', sha.slice(0, 7), f, e);
						// Non-fatal: treat as meaningful to avoid dropping commits due to tooling issues
                        meaningful = true;
                        // fallthrough to YAML extraction
					}
					// If diff is null (binary missing or failed), keep commit non-fatally
                    if (diff == null || hasMeaningfulChanges(diff)) {
                        meaningful = true;
                        // Extract bullets via YAML compare
                        try {
                            const baseDoc: any = yaml.load(baseContent);
                            const headDoc: any = yaml.load(headContent);
                            // operations added
                            const baseOps = new Set<string>();
                            const headOps = new Set<string>();
                            const basePaths = (baseDoc?.paths || {}) as Record<string, any>;
                            const headPaths = (headDoc?.paths || {}) as Record<string, any>;
                            for (const p of Object.keys(basePaths)) {
                                const obj = basePaths[p] || {};
                                for (const m of Object.keys(obj)) if (typeof obj[m] === 'object') baseOps.add(`${m.toUpperCase()} ${p}`);
                            }
                            for (const p of Object.keys(headPaths)) {
                                const obj = headPaths[p] || {};
                                for (const m of Object.keys(obj)) if (typeof obj[m] === 'object') headOps.add(`${m.toUpperCase()} ${p}`);
                            }
                            for (const op of headOps) if (!baseOps.has(op)) bullets.push(`Added ${op}`);
                            // schema properties added
                            const baseSchemas = (baseDoc?.components?.schemas || {}) as Record<string, any>;
                            const headSchemas = (headDoc?.components?.schemas || {}) as Record<string, any>;
                            for (const schemaName of Object.keys(headSchemas)) {
                                const headProps = headSchemas[schemaName]?.properties || {};
                                const baseProps = baseSchemas[schemaName]?.properties || {};
                                for (const propName of Object.keys(headProps)) {
                                    if (!(propName in baseProps)) bullets.push(`Schema ${schemaName}: added property ${propName}`);
                                }
                            }
                        } catch {}
                    }
				}
                if (!meaningful) commitMap.delete(sha);
                else if (bullets.length > 0) commitBullets.set(sha, bullets);
			} catch (err) {
				dbgOpenApi('diff: error for %s %o', sha.slice(0, 7), err);
				// Non-fatal
			}
		}
	}

	const dayBuckets = new Map<string, Array<{ sha: string; message: string; files: Array<string> }>>();
    for (const { sha, message, date, files } of commitMap.values()) {
		if (!dayBuckets.has(date)) dayBuckets.set(date, []);
        const bullets = commitBullets.get(sha) || [];
        const msg = bullets.length > 0 ? bullets.slice(0, 5).join('; ') : message;
        dayBuckets.get(date)!.push({ sha, message: msg, files: Array.from(files).sort() });
	}

	const days = Array.from(dayBuckets.keys()).sort();
	const files: Array<{ path: string; content: string; commitMessage: string }> = [];
	let latestSha: string | null = currentCachedSha;
	let totalCommits = 0;
	for (const day of days) {
		const entries = dayBuckets.get(day)!;
		entries.sort((a, b) => (a.sha < b.sha ? -1 : 1));
		for (const e of entries) latestSha = e.sha;
		files.push(opts.buildEntry(day, entries));
		totalCommits += entries.length;
		dbgOpenApi('day %s: %d meaningful commits', day, entries.length);
	}

	return { files, latestSha, report: { days: days.length, commits: totalCommits } };
}


