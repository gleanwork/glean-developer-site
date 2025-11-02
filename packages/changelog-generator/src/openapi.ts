import type { Endpoints } from '@octokit/types';
import type { Octokit } from 'octokit';

export type OpenApiConfig = {
	enabled: boolean;
	repo: { owner: string; repo: string };
	paths: Array<string>;
	lookbackDays: number;
};

export type OpenApiIngestResult = {
	files: Array<{ path: string; content: string; commitMessage: string }>;
	latestSha: string | null;
	report: { days: number; commits: number };
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

	if (opts.cachedSha) {
		// If we had a cached SHA, use commit listing with since omitted and rely on path filtering
		// We'll still pass a since based on a generous lookback to cap volume
		sinceIso = toIsoStartOfDay(minusDaysUtc(opts.cfg.lookbackDays));
	} else if (opts.latestLocalEntryDate) {
		const d = new Date(opts.latestLocalEntryDate + 'T00:00:00Z');
		// Start the next day to avoid duplicate processing of the same date
		const next = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1));
		sinceIso = toIsoStartOfDay(next);
	} else {
		sinceIso = toIsoStartOfDay(minusDaysUtc(opts.cfg.lookbackDays));
	}

	const commitMap = new Map<string, { sha: string; message: string; date: string; files: Set<string> }>();
	for (const p of opts.cfg.paths) {
		const commits = await listCommitsForPath(opts.octokit, owner, repo, p, sinceIso);
		for (const c of commits) {
			const sha = c.sha;
			const msg = (c.commit?.message || '').split('\n')[0];
			const dateStr = c.commit?.committer?.date || c.commit?.author?.date || '';
			const day = dateStr ? formatDay(new Date(dateStr)) : '';
			if (!sha || !day) continue;
			const prev = commitMap.get(sha);
			if (!prev) {
				commitMap.set(sha, { sha, message: msg, date: day, files: new Set([p]) });
			} else {
				prev.files.add(p);
			}
		}
	}

	// Group by day
	const dayBuckets = new Map<string, Array<{ sha: string; message: string; files: Array<string> }>>();
	for (const { sha, message, date, files } of commitMap.values()) {
		if (!dayBuckets.has(date)) dayBuckets.set(date, []);
		dayBuckets.get(date)!.push({ sha, message, files: Array.from(files).sort() });
	}

	// Sort days ascending
	const days = Array.from(dayBuckets.keys()).sort();
	const files: Array<{ path: string; content: string; commitMessage: string }> = [];
	let latestSha: string | null = null;
	let commitCount = 0;
	for (const day of days) {
		const entries = dayBuckets.get(day)!;
		entries.sort((a, b) => (a.sha < b.sha ? -1 : 1));
		// Track latest sha by lexicographic order of appearance in listing (approximate)
		for (const e of entries) {
			latestSha = e.sha;
		}
		const file = opts.buildEntry(day, entries);
		files.push(file);
		commitCount += entries.length;
	}

	return { files, latestSha, report: { days: days.length, commits: commitCount } };
}
