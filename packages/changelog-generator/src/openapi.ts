import type { Endpoints } from '@octokit/types';
import type { Octokit } from 'octokit';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { createRequire } from 'node:module';
import yaml from 'js-yaml';
import { runOpenApiChanges } from './openapi-changes-runner.js';

const OPENAPI_BASELINE_CACHE_PATH = path.join('packages', 'changelog-generator', '.gleanwork-open-api-last-changed');

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
	diffEngine?: 'openapi-changes' | 'none';
};

export type OpenApiIngestResult = {
	files: Array<{ path: string; content: string; commitMessage: string }>;
	latestSha: string | null;
	report: { days: number; commits: number; diffToolFailures: number };
};

type CommitDetail = {
	sha: string;
	message: string;
	date: string;
	files: Set<string>;
	diffs?: Array<{ baseYaml: string; headYaml: string; diff: any }>;
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
	const commits: Endpoints['GET /repos/{owner}/{repo}/commits']['response']['data'] = [];
	
	for await (const response of octokit.paginate.iterator(
		octokit.rest.repos.listCommits,
		{
			owner,
			repo,
			path,
			since: sinceIso,
			per_page: 100,
		}
	)) {
		commits.push(...response.data);
		if (commits.length >= 200) break;
	}
	return commits;
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

function extractBulletsFromDiff(diff: any): Array<string> {
    const bullets: Array<string> = [];
    if (!diff || typeof diff !== 'object') return bullets;

    // Shape 1: flat arrays of items with type and value (openapi-changes JSON)
    const arrays = ['added', 'changed', 'removed'] as const;
    for (const key of arrays) {
        const arr: Array<any> = Array.isArray(diff[key]) ? diff[key] : [];
        for (const item of arr) {
            const type = (item?.type || item?.kind || '').toString();
            const v = item?.value || {};
            const path = v.path || v.url || v.name || v.id || '';
            const method = (v.method || v.verb || '').toString().toUpperCase();
            if (type === 'PathItem' && path) bullets.push(`${capitalize(key)} path: ${path}`);
            else if (type === 'Operation' && method && path) bullets.push(`${capitalize(key)} operation: ${method} ${path}`);
            else if (type === 'Schema' && v.name) bullets.push(`${capitalize(key)} schema: ${v.name}`);
            else if (type === 'Parameter' && v.name && v.in) bullets.push(`${capitalize(key)} parameter: ${v.name} (${v.in})`);
            else if (type === 'Response' && v.code) bullets.push(`${capitalize(key)} response: ${v.code}`);
        }
    }

    // Shape 2: nested objects for paths/operations/components
    const methodKeys = ['get','post','put','delete','patch','head','options','trace'];
    const pathsNode: any = diff.paths || diff.changedPaths || {};
    if (pathsNode && typeof pathsNode === 'object') {
        for (const pathName of Object.keys(pathsNode)) {
            const pEntry = pathsNode[pathName] || {};
            const opsContainer = pEntry.operations || pEntry.changed || pEntry.added || pEntry;
            for (const m of methodKeys) {
                const op = opsContainer?.[m] || opsContainer?.[m.toUpperCase()];
                if (!op) continue;
                const isChanged = typeof op === 'boolean' ? op : Object.keys(op).length > 0;
                if (isChanged) bullets.push(`Changed operation: ${m.toUpperCase()} ${pathName}`);
            }
        }
    }

    const componentsNode: any = diff.components || {};
    const schemasNode: any = componentsNode.schemas || diff.schemas || {};
    if (Array.isArray(schemasNode.added)) {
        for (const s of schemasNode.added) bullets.push(`Added schema: ${String(s)}`);
    }
    if (schemasNode.changed && typeof schemasNode.changed === 'object') {
        for (const sName of Object.keys(schemasNode.changed)) {
            const sDiff = schemasNode.changed[sName] || {};
            const props = sDiff.properties || {};
            const propsAdded: Array<string> = props.added || [];
            for (const prop of propsAdded) bullets.push(`Schema ${sName}: added property ${String(prop)}`);
        }
    }

    // Fallback summary when structure differs but we still know there are changes
    if (bullets.length === 0 && hasMeaningfulChanges(diff)) {
        const pathAdded = countArrayLen(diff.added, (i: any) => i?.type === 'PathItem');
        const opAdded = countArrayLen(diff.added, (i: any) => i?.type === 'Operation');
        const schemaAdded = countArrayLen(diff.added, (i: any) => i?.type === 'Schema');
        const opChanged = countArrayLen(diff.changed, (i: any) => i?.type === 'Operation');
        const schemaChanged = countArrayLen(diff.changed, (i: any) => i?.type === 'Schema');
        const parts: Array<string> = [];
        if (pathAdded) parts.push(`paths added: ${pathAdded}`);
        if (opAdded) parts.push(`operations added: ${opAdded}`);
        if (opChanged) parts.push(`operations changed: ${opChanged}`);
        if (schemaAdded) parts.push(`schemas added: ${schemaAdded}`);
        if (schemaChanged) parts.push(`schemas changed: ${schemaChanged}`);
        if (parts.length > 0) bullets.push(parts.join(', '));
    }

    return bullets;
}

function countArrayLen(arr: any, pred: (v: any) => boolean): number {
    if (!Array.isArray(arr)) return 0;
    let n = 0;
    for (const v of arr) if (pred(v)) n += 1;
    return n;
}

function capitalize(s: string): string {
    return s && s.length > 0 ? s[0].toUpperCase() + s.slice(1) : s;
}

export async function ingestOpenApiCommits(opts: {
	octokit: Octokit;
	cfg: OpenApiConfig;
	latestLocalEntryDate: string | null;
	cachedSha: string | null;
	buildEntry: (day: string, commits: Array<{ sha: string; message: string; files: Array<string>; diffs?: Array<{ baseYaml: string; headYaml: string; diff: any }> }>) => Promise<{ path: string; content: string; commitMessage: string } | null>;
}): Promise<OpenApiIngestResult> {
	if (!opts.cfg.enabled) return { files: [], latestSha: null, report: { days: 0, commits: 0, diffToolFailures: 0 } };

	const { owner, repo } = opts.cfg.repo;

    let sinceIso: string | undefined = undefined;
    let currentCachedSha: string | null = opts.cachedSha;

	const cacheFilePath = path.join(process.cwd(), OPENAPI_BASELINE_CACHE_PATH);
	if (fs.existsSync(cacheFilePath)) {
		try {
			currentCachedSha = fs.readFileSync(cacheFilePath, 'utf-8').trim();
			dbgOpenApi('ingest: cached sha %s', currentCachedSha);
		} catch {}
	}

    // Primary: anchor to latest local changelog entry date
    if (opts.latestLocalEntryDate) {
        const d = new Date(opts.latestLocalEntryDate + 'T00:00:00Z');
        const next = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1));
        sinceIso = toIsoStartOfDay(next);
    } else if (currentCachedSha) {
        // Secondary: fallback to last processed baseline SHA date
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
        // Final fallback: lookback window
        sinceIso = toIsoStartOfDay(minusDaysUtc(opts.cfg.lookbackDays));
    }

    const commitMap = new Map<string, CommitDetail>();
    const commitBullets = new Map<string, Array<string>>();
    const commitDiffs = new Map<string, Array<any>>();
	for (const p of opts.cfg.paths) {
		dbgOpenApi('list: %s/%s path=%s since=%s', owner, repo, p, sinceIso || 'none');
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

	const engine = opts.cfg.diffEngine ?? 'openapi-changes';
	const isVitest = !!process.env.VITEST_WORKER_ID;
	const useDiff = opts.cfg.diffEnabled !== false && engine === 'openapi-changes' && !isVitest;
	let diffToolFailures = 0;
	
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
						diffToolFailures++;
						dbgOpenApi('diff: runner error for %s file %s %o', sha.slice(0, 7), f, e);
					}
					if (diff != null) {
						if (hasMeaningfulChanges(diff)) {
							meaningful = true;
							const diffBullets = extractBulletsFromDiff(diff);
							if (diffBullets.length > 0) bullets.push(...diffBullets);
							
							if (!commitDiffs.has(sha)) {
								commitDiffs.set(sha, []);
							}
							commitDiffs.get(sha)!.push({ baseYaml: baseContent, headYaml: headContent, diff });
						}
					}
				}
				if (!meaningful) {
					commitMap.delete(sha);
				} else if (bullets.length > 0) {
					commitBullets.set(sha, bullets);
				}
			} catch (err) {
				dbgOpenApi('diff: error for %s %o', sha.slice(0, 7), err);
			}
		}
	}

	const dayBuckets = new Map<string, Array<{ sha: string; message: string; files: Array<string>; diffs?: Array<{ baseYaml: string; headYaml: string; diff: any }> }>>();
    for (const { sha, message, date, files } of commitMap.values()) {
		if (!dayBuckets.has(date)) dayBuckets.set(date, []);
        const bullets = commitBullets.get(sha) || [];
        const msg = bullets.length > 0 ? bullets.slice(0, 5).join('; ') : message;
        const diffs = commitDiffs.get(sha);
        dayBuckets.get(date)!.push({ sha, message: msg, files: Array.from(files).sort(), diffs });
	}

	const days = Array.from(dayBuckets.keys()).sort();
	const files: Array<{ path: string; content: string; commitMessage: string }> = [];
	let latestSha: string | null = currentCachedSha;
	let totalCommits = 0;
	for (const day of days) {
		const entries = dayBuckets.get(day)!;
		entries.sort((a, b) => (a.sha < b.sha ? -1 : 1));
		for (const e of entries) latestSha = e.sha;
		const entry = await opts.buildEntry(day, entries);
		if (entry !== null) {
			files.push(entry);
		}
		totalCommits += entries.length;
		dbgOpenApi('day %s: %d meaningful commits', day, entries.length);
	}

	return { files, latestSha, report: { days: days.length, commits: totalCommits, diffToolFailures } };
}


