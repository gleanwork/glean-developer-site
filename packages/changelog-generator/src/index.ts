import * as fs from 'node:fs';
import * as path from 'node:path';
import * as dotenv from 'dotenv';
import { findUp } from 'find-up';
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import * as os from 'node:os';
import { loadConfig } from './config.js';
import { summarizeRelease } from './summarizer.js';
import { getLatestChangelogEntryDate } from './latest-entry.js';
import { createOctokit, listReleases, findExistingChangelogPR } from './octo.js';
import type { RepoReleases, PullRequest } from './octo.js';
import type { AnalyzeOutput } from './schemas.js';
import { renderChangelogEntry } from './template.js';
import { ingestOpenApiCommits } from './openapi.js';
import { analyzeOpenApiChangesWithContext, formatChangeCategories } from './openapi-summary.js';
import { enrichChangesWithContext } from './openapi-context.js';

const OPENAPI_ENTRY_FILENAME_PATTERN = /rest-api-(updates|changes)-open-api\.md$/;
const DEFAULT_OWNER = 'gleanwork';
const DEFAULT_REPO = 'glean-developer-site';
const DEFAULT_OPENAPI_REPO = 'open-api';
const GITHUB_RELEASES_LIMIT = 100;
const GITHUB_COMMITS_LIMIT = 200;

const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-var-requires
const dbg: any = require('debug');
const dbgBase = dbg('changelog');
const dbgGitBase = dbg('changelog:git');
const useDebug = typeof dbgBase?.enabled === 'boolean' ? dbgBase.enabled : !!process.env.DEBUG;
const log = (...args: Array<any>) => {
  if (useDebug) {
    dbgBase(...args);
  } else {
    console.log('[changelog]', ...args);
  }
};
const logGit = (...args: Array<any>) => {
  if (useDebug) {
    dbgGitBase(...args);
  } else {
    console.log('[changelog:git]', ...args);
  }
};

function toErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return String((err as any).message);
  }
  return String(err);
}

function usage(): never {
  console.error(
    'Usage: node dist/index.js <analyze|apply|run> [--dry-run] [--input <path>]',
  );
  process.exit(2);
}

function today(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function safeSlug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeTag(tag: string): string {
  return tag.replace(/^v/i, '').replace(/\./g, '-');
}

function writePreview(analyzed: AnalyzeOutput, repoRoot: string): string {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const previewDir = path.join(repoRoot, `.changelog-preview-${ts}`);
  fs.mkdirSync(previewDir, { recursive: true });
  for (const f of analyzed.files) {
    const abs = path.join(previewDir, f.path);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, f.content);
  }
  return previewDir;
}

async function findRepoRoot(startDir: string): Promise<string> {
  const templateFile = await findUp((dir: string) => {
    const p = path.join(dir, 'scripts', 'templates', 'changelog-entry.md');
    return fs.existsSync(p) ? p : undefined;
  }, { cwd: startDir });
  if (!templateFile) return startDir;
  return path.resolve(path.dirname(templateFile), '..', '..');
}

async function analyze(repoRoot: string): Promise<AnalyzeOutput> {
  const latestDate = getLatestChangelogEntryDate(repoRoot);
  const cfg = loadConfig(repoRoot);
  const octokit = createOctokit();

  const includedFiles: Array<{
    path: string;
    content: string;
    commitMessage: string;
  }> = [];
  const skipped: AnalyzeOutput['report']['skipped'] = [];
  const errors: AnalyzeOutput['report']['errors'] = [];

  const cutoff = latestDate ?? '0000-00-00';

  log(`Latest local entry date: ${latestDate ?? 'null'}`);

  for (const spec of cfg.repos) {
    try {
      log(`Analyzing ${spec.owner}/${spec.repo} ...`);
      const releases: RepoReleases = await listReleases(octokit, {
        owner: spec.owner,
        repo: spec.repo,
      });
      const candidates = releases
        .filter((r: RepoReleases[number]) => !!r.published_at)
        .sort((a: RepoReleases[number], b: RepoReleases[number]) =>
          a.published_at! < b.published_at! ? 1 : -1,
        );

      if (candidates.length === 0) {
        skipped.push({
          owner: spec.owner,
          repo: spec.repo,
          decision: 'skip',
          reason: 'no releases',
        });
        log(`${spec.repo}: skip (no releases)`);
        continue;
      }

      const newReleases = candidates.filter((r: RepoReleases[number]) => {
        const relDate = r.published_at!.slice(0, 10);
        return relDate > cutoff;
      });

      if (newReleases.length === 0) {
        skipped.push({
          owner: spec.owner,
          repo: spec.repo,
          decision: 'skip',
          reason: 'no newer release than latest entry',
        });
        log(`${spec.repo}: skip (no newer release than ${cutoff})`);
        continue;
      }

      log(`${spec.repo}: processing ${newReleases.length} release(s) after ${cutoff}`);

      for (const release of newReleases) {
        const relDate = release.published_at!.slice(0, 10);
        const tag = release.tag_name || 'unknown';
        const url = release.html_url || release.url || '';
        const normalized = normalizeTag(tag);
        const title = `${spec.repo} ${tag}`;

        const body = release.body?.trim() ?? '';
        const summaryText = await summarizeRelease(body || title, {
          mode: cfg.summarization.mode,
          maxBullets: cfg.summarization.maxBullets,
          maxChars: cfg.summarization.maxChars,
          model: cfg.summarization.model,
          category: spec.category,
          hints: cfg.summarization.categoryHints?.[spec.category] || [],
        });
        const summary = summaryText;

        const details = `Full release notes: ${url}`;
        const datePrefix = relDate;
        const slug = `${safeSlug(spec.repo)}-${safeSlug(normalized)}`;

        let filename = `${datePrefix}-${slug}.md`;
        const entriesDir = path.join(repoRoot, 'changelog', 'entries');
        let counter = 1;
        while (fs.existsSync(path.join(entriesDir, filename))) {
          filename = `${datePrefix}-${slug}-${counter}.md`;
          counter += 1;
        }

        const filePath = path.join('changelog', 'entries', filename);
        const content = renderChangelogEntry({
          repoRoot,
          title,
          categories: [spec.category],
          summary,
          detailedContent: details,
        });
        const commitMessage = `chore(changelog): add ${spec.repo} ${tag}`;
        includedFiles.push({ path: filePath, content, commitMessage });
        log(`${spec.repo}: queued ${filePath}`);
      }
    } catch (e: any) {
      errors.push({
        owner: spec.owner,
        repo: spec.repo,
        reason: e?.message || 'error',
      });
      log(`${spec.owner}/${spec.repo}: error: ${e?.message || e}`);
    }
  }

  // OpenAPI-derived entries (API category)
  try {
    const openapiCfg = cfg.openapi;
    if (openapiCfg && openapiCfg.enabled && openapiCfg.repo && Array.isArray(openapiCfg.paths) && openapiCfg.paths.length > 0) {
        const res = await ingestOpenApiCommits({
        octokit,
        cfg: {
          enabled: true,
          repo: { owner: openapiCfg.repo.owner, repo: openapiCfg.repo.repo },
          paths: openapiCfg.paths,
          lookbackDays: Number(openapiCfg.lookbackDays || 30),
          diffEnabled: openapiCfg.diffEnabled,
          diffEngine: openapiCfg.diffEngine,
          diffBin: (openapiCfg as any).diffBin,
        },
        latestLocalEntryDate: latestDate,
        buildEntry: async (day, commits) => {
          const allChanges: Array<any> = [];
          let baseYaml = '';
          let headYaml = '';
          
          for (const c of commits) {
            if (c.diffs) {
              for (const diffData of c.diffs) {
                if (diffData.baseYaml) baseYaml = diffData.baseYaml;
                if (diffData.headYaml) headYaml = diffData.headYaml;
                if (diffData.diff?.changes) {
                  allChanges.push(...diffData.diff.changes);
                }
              }
            }
          }
          
          if (allChanges.length === 0) {
            log(`Skipping OpenAPI entry for ${day}: no changes found`);
            return null;
          }
          
          const contextualChanges = enrichChangesWithContext(allChanges, baseYaml, headYaml);
          const analyzed = analyzeOpenApiChangesWithContext(contextualChanges);
          
          if (analyzed.categories.size === 0) {
            log(`Skipping OpenAPI entry for ${day}: no meaningful changes detected`);
            return null;
          }
          
          const changeTypes = formatChangeCategories(analyzed.categories);
          const title = `REST API: changes (${changeTypes}) ${day}`;
          
          const detailedContent = analyzed.details.join('\n');
          
          const content = renderChangelogEntry({
            repoRoot,
            title,
            categories: ['API'],
            summary: analyzed.summary,
            detailedContent,
          });
          const filename = `${day}-rest-api-changes-open-api.md`;
          return {
            path: path.join('changelog', 'entries', filename),
            content,
            commitMessage: `chore(changelog): add REST API changes ${day}`,
          };
        },
      });
      includedFiles.push(...res.files);
      log(`OpenAPI ingest: days=${res.report.days} commits=${res.report.commits} files=${res.files.length} diffToolFailures=${res.report.diffToolFailures}`);
      if (res.report.diffToolFailures > 0) {
        log(`Warning: ${res.report.diffToolFailures} OpenAPI diff tool failures occurred`);
      }
      if (res.files.length === 0) {
        skipped.push({ owner: openapiCfg.repo.owner, repo: openapiCfg.repo.repo, decision: 'skip', reason: 'no new open-api commits' });
      }
    }
  } catch (e: any) {
    errors.push({ owner: DEFAULT_OWNER, repo: DEFAULT_OPENAPI_REPO, reason: e?.message || 'error' });
  }

  const bundleDate = today();
  const pr = {
    targetRepo: { owner: cfg.owner, repo: DEFAULT_REPO },
    baseBranch: cfg.baseBranch,
    branchName: `chore/changelog-${bundleDate}-${randomUUID().slice(0, 8)}`,
    title: `chore(changelog): ${bundleDate}`,
    body:
      includedFiles.length === 0
        ? 'No new entries.'
        : [
            `Adds ${includedFiles.length} changelog entries generated on ${bundleDate}.`,
            '',
            'Files:',
            ...includedFiles.map((f) => `- ${f.path}`),
            skipped.length > 0 ? '' : null,
            skipped.length > 0 ? 'Skipped:' : null,
            ...skipped.map(
              (s: AnalyzeOutput['report']['skipped'][number]) =>
                `- {repo: ${s.repo}, decision: ${s.decision}, reason: ${s.reason}}`,
            ),
            errors.length > 0 ? '' : null,
            errors.length > 0 ? 'Errors:' : null,
            ...errors.map((er: AnalyzeOutput['report']['errors'][number]) => `- {repo: ${er.repo}, reason: ${er.reason}}`),
          ]
            .filter((v) => v !== null)
            .join('\n'),
  };

  const out: AnalyzeOutput = {
    latestChangelogEntryDate: latestDate,
    pr,
    files: includedFiles,
    report: {
      stats: {
        totalProcessed: cfg.repos.length,
        includedCount: includedFiles.length,
        skippedCount: skipped.length,
        errorCount: errors.length,
      },
      skipped,
      errors,
    },
  };

  log(
    `Processed ${cfg.repos.length}; include ${includedFiles.length}, skip ${skipped.length}, error ${errors.length}`,
  );
  return out;
}

function runGit(args: Array<string>, cwd: string) {
  const { spawnSync } = require('node:child_process');
  const res = spawnSync('git', args, { stdio: 'inherit', cwd, shell: false });
  if (typeof res.status === 'number' && res.status !== 0) {
    throw new Error(`git ${args.join(' ')} failed with code ${res.status}`);
  }
}

function getDefaultCloneUrl(): string {
  const token = process.env.GITHUB_TOKEN;
  const base = `github.com/${DEFAULT_OWNER}/${DEFAULT_REPO}.git`;
  return token
    ? `https://x-access-token:${token}@${base}`
    : `https://${base}`;
}

function isDirty(cwd: string): boolean {
  const { spawnSync } = require('node:child_process');
  try {
    const res = spawnSync('git', ['status', '--porcelain'], {
      cwd,
      stdio: ['ignore', 'pipe', 'ignore'],
      shell: false,
      encoding: 'utf8',
    });
    if (typeof res.status === 'number' && res.status !== 0) return true;
    const out = (res.stdout || '').toString().trim();
    return out.length > 0;
  } catch {
    return true;
  }
}

function isGitRepo(cwd: string): boolean {
  const { spawnSync } = require('node:child_process');
  try {
    const res = spawnSync('git', ['rev-parse', '--is-inside-work-tree'], {
      cwd,
      stdio: 'ignore',
      shell: false,
    });
    return typeof res.status === 'number' ? res.status === 0 : false;
  } catch {
    return false;
  }
}

async function applyAction(repoRoot: string, inputPath?: string): Promise<void> {
  const inputStr = inputPath
    ? fs.readFileSync(inputPath, 'utf-8')
    : fs.readFileSync(0, 'utf-8');
  const data: AnalyzeOutput = JSON.parse(inputStr);

  if (data.files.length === 0) {
    const summary = {
      owner: data.pr.targetRepo.owner,
      repo: data.pr.targetRepo.repo,
      baseBranch: data.pr.baseBranch,
      branchName: data.pr.branchName,
      filesWritten: [],
      commitCount: 0,
      prUrl: null,
      prNumber: null,
      status: 'no_changes',
    };
    process.stdout.write(JSON.stringify(summary, null, 2));
    return;
  }

  const providedWorktree = !!process.env.CHANGELOG_WORKTREE;
  let workdir = providedWorktree ? path.resolve(process.env.CHANGELOG_WORKTREE as string) : repoRoot;
  let createdTempDir: string | null = null;
  const repoPresent = isGitRepo(workdir);

  if (providedWorktree) {
    if (!repoPresent) {
      fs.mkdirSync(workdir, { recursive: true });
      runGit(['clone', getDefaultCloneUrl(), '.'], workdir);
    } else if (isDirty(workdir)) {
      logGit('Provided worktree is dirty; resetting and cleaning');
      runGit(['reset', '--hard'], workdir);
      runGit(['clean', '-fdx'], workdir);
    }
  } else {
    if (!repoPresent) {
      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'changelog-gen-'));
      workdir = tmp;
      createdTempDir = tmp;
      runGit(['clone', getDefaultCloneUrl(), '.'], workdir);
    } else if (isDirty(workdir)) {
      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'changelog-gen-'));
      workdir = tmp;
      createdTempDir = tmp;
      runGit(['clone', getDefaultCloneUrl(), '.'], workdir);
    }
  }

  try {
    logGit(`Using workdir: ${workdir}`);
    runGit(['fetch', 'origin', data.pr.baseBranch], workdir);
    runGit(['checkout', '-B', data.pr.baseBranch, `origin/${data.pr.baseBranch}`], workdir);

    try {
      runGit(['config', '--local', 'user.name', process.env.GIT_AUTHOR_NAME || 'github-actions[bot]'], workdir);
      runGit(['config', '--local', 'user.email', process.env.GIT_AUTHOR_EMAIL || '41898282+github-actions[bot]@users.noreply.github.com'], workdir);
    } catch (err) {
      logGit(`Failed to set git config: ${toErrorMessage(err)}`);
    }

    const octokit = createOctokit();
    const bundleDate = today();
    const branchPrefix = `chore/changelog-${bundleDate}`;
    
    let existingPR: PullRequest | null = null;
    let branch = data.pr.branchName;
    let isUpdatingExistingPR = false;

    try {
      existingPR = await findExistingChangelogPR(octokit, {
        owner: data.pr.targetRepo.owner,
        repo: data.pr.targetRepo.repo,
        branchPrefix,
        baseBranch: data.pr.baseBranch,
      });
    } catch (err) {
      logGit(`Failed to check for existing PR: ${toErrorMessage(err)}`);
    }

    if (existingPR) {
      branch = existingPR.head.ref;
      isUpdatingExistingPR = true;
      logGit(`Found existing PR #${existingPR.number} with branch ${branch}, will update it`);
      try {
        runGit(['fetch', 'origin', branch], workdir);
        runGit(['checkout', branch], workdir);
      } catch (err) {
        logGit(`Failed to checkout existing branch ${branch}, creating new branch: ${toErrorMessage(err)}`);
        isUpdatingExistingPR = false;
        try {
          runGit(['checkout', '-b', branch], workdir);
        } catch {
          branch = `${branch}-${randomUUID().slice(0, 8)}`;
          runGit(['checkout', '-b', branch], workdir);
        }
      }
    } else {
      logGit(`No existing PR found for ${branchPrefix}, creating new branch`);
      try {
        runGit(['checkout', '-b', branch], workdir);
      } catch {
        branch = `${branch}-${randomUUID().slice(0, 8)}`;
        runGit(['checkout', '-b', branch], workdir);
      }
    }

    const written: Array<string> = [];
    let commitCount = 0;
    for (const f of data.files) {
      const abs = path.join(workdir, f.path);
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, f.content);
      try {
        runGit(['add', f.path], workdir);
        runGit(['commit', '-m', f.commitMessage], workdir);
        written.push(f.path);
        commitCount += 1;
      } catch (err) {
        logGit(`Failed to add/commit ${f.path}: ${toErrorMessage(err)}`);
      }
    }


    if (commitCount === 0) {
      const summary = {
        owner: data.pr.targetRepo.owner,
        repo: data.pr.targetRepo.repo,
        baseBranch: data.pr.baseBranch,
        branchName: branch,
        filesWritten: written,
        commitCount,
        prUrl: null,
        prNumber: null,
        status: 'no_changes',
      } as const;
      process.stdout.write(JSON.stringify(summary, null, 2));
      return;
    }

    runGit(['push', '-u', 'origin', branch], workdir);

    let prUrl: string | null = null;
    let prNumber: number | null = null;
    let status: 'created' | 'updated' = 'created';

    if (isUpdatingExistingPR && existingPR) {
      logGit(`Updating existing PR #${existingPR.number}`);
      
      const newBody = [
        existingPR.body || '',
        '',
        `---`,
        `**Updated**: Added ${written.length} new changelog entries in ${commitCount} commit(s).`,
        '',
        'New files:',
        ...written.map((f) => `- ${f}`),
      ].join('\n');

      try {
        await octokit.rest.pulls.update({
          owner: data.pr.targetRepo.owner,
          repo: data.pr.targetRepo.repo,
          pull_number: existingPR.number,
          body: newBody,
        });
        prUrl = existingPR.html_url;
        prNumber = existingPR.number;
        status = 'updated';
      } catch (err) {
        logGit(`Failed to update PR body: ${toErrorMessage(err)}`);
        prUrl = existingPR.html_url;
        prNumber = existingPR.number;
        status = 'updated';
      }
    } else {
      logGit(`Creating new PR`);
      const prRes = await octokit.rest.pulls.create({
        owner: data.pr.targetRepo.owner,
        repo: data.pr.targetRepo.repo,
        head: branch,
        base: data.pr.baseBranch,
        title: data.pr.title,
        body: data.pr.body,
      });
      prUrl = prRes.data.html_url;
      prNumber = prRes.data.number;
      status = 'created';
    }

    const summary = {
      owner: data.pr.targetRepo.owner,
      repo: data.pr.targetRepo.repo,
      baseBranch: data.pr.baseBranch,
      branchName: branch,
      filesWritten: written,
      commitCount,
      prUrl,
      prNumber,
      status,
    } as const;

    process.stdout.write(JSON.stringify(summary, null, 2));
  } finally {
    if (createdTempDir) {
      try {
        fs.rmSync(createdTempDir, { recursive: true, force: true });
      } catch {}
    }
  }
}

async function main() {
  const repoRoot = await findRepoRoot(process.cwd());
  // Load env from repo root explicitly so workspace runs see root .env
  try {
    const rootEnvPath = path.join(repoRoot, '.env');
    const pkgEnvPath = path.join(repoRoot, 'packages', 'changelog-generator', '.env');
    if (fs.existsSync(rootEnvPath)) dotenv.config({ path: rootEnvPath });
    if (fs.existsSync(pkgEnvPath)) dotenv.config({ path: pkgEnvPath });
  } catch {
    // ignore
  }
  const args = process.argv.slice(2);
  const cmd = args[0];
  if (!cmd) return usage();

  if (cmd === 'analyze') {
    const result = await analyze(repoRoot);
    process.stdout.write(JSON.stringify(result, null, 2));
    process.exit(0);
  }

  if (cmd === 'apply') {
    const inputIdx = args.indexOf('--input');
    const inputPath = inputIdx >= 0 ? args[inputIdx + 1] : undefined;
    await applyAction(repoRoot, inputPath);
    process.exit(0);
  }

  if (cmd === 'run') {
    const isDryRun =
      args.includes('--dry-run') ||
      args.includes('-dry-run') ||
      args.includes('--dry_run');
    const analyzed = await analyze(repoRoot);
    if (isDryRun) {
      const previewDir = writePreview(analyzed, repoRoot);
      process.stdout.write(JSON.stringify(analyzed, null, 2));
      log(`Preview written to: ${previewDir}`);
      if (analyzed.files.length > 0) {
        log('Files:');
        for (const f of analyzed.files) {
          log(`- ${f.path} (${Buffer.byteLength(f.content, 'utf8')} bytes)`);
        }
        for (const f of analyzed.files) {
          log(`===== ${f.path} =====`);
          log('```md\n' + f.content + '\n```');
        }
      }
      process.exit(0);
    }
    const tmpPath = path.join(repoRoot, '.changelog-generator-output.json');
    fs.writeFileSync(tmpPath, JSON.stringify(analyzed, null, 2));
    await applyAction(repoRoot, tmpPath);
    fs.rmSync(tmpPath, { force: true });
    process.exit(0);
  }

  return usage();
}

main().catch((err) => {
  console.error('[main]', err?.stack || err?.message || String(err));
  process.exit(1);
});



