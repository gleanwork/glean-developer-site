import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { createRequire } from 'node:module';
import { loadConfig } from '../config.js';
import { getLatestChangelogEntryDate } from '../latest-entry.js';
import { createOctokit, findExistingChangelogPR } from '../octo.js';
import type { PullRequest } from '../octo.js';
import type { AnalyzeOutput } from '../schemas.js';
import { renderChangelogEntry } from '../template.js';
import { ingestOpenApiCommits } from '../openapi.js';
import {
  analyzeOpenApiChangesWithContext,
  formatChangeCategories,
} from '../openapi-summary.js';
import { enrichChangesWithContext } from '../openapi-context.js';
import { processAllReleases } from '../pipeline.js';
import { renderNormalizedRelease } from '../normalized-renderer.js';
import type { NormalizedChange, SourceRef } from '../types.js';

const DEFAULT_OWNER = 'gleanwork';
const DEFAULT_REPO = 'glean-developer-site';
const DEFAULT_OPENAPI_REPO = 'open-api';

const require = createRequire(import.meta.url);
const dbg: any = require('debug');
const dbgBase = dbg('changelog');
const dbgGitBase = dbg('changelog:git');
const useDebug =
  typeof dbgBase?.enabled === 'boolean' ? dbgBase.enabled : !!process.env.DEBUG;
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
    return String((err as any).message);
  }
  return String(err);
}

function parseReleaseIdentifier(identifier: string): {
  owner: string;
  repo: string;
  tag?: string;
} {
  const [repoPart, ...tagParts] = identifier.split(/\s+/);
  const repoParts = repoPart.split('/');
  return {
    owner: repoParts.length > 1 ? repoParts[0] : '',
    repo: repoParts.length > 1 ? repoParts[1] : repoPart,
    tag: tagParts.length > 0 ? tagParts.join(' ') : undefined,
  };
}

function today(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function normalizeOpenApiDetails(
  details: string[],
  breaking: boolean,
): NormalizedChange[] {
  const changes: NormalizedChange[] = [];
  let context = '';
  for (const raw of details) {
    const line = raw.trim();
    if (!line) continue;
    const heading = line.match(/^\*\*([^*]+)\*\*$/);
    if (heading) {
      context = heading[1];
      continue;
    }
    const cleaned = line
      .replace(/^[-*]\s+/, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!cleaned) continue;
    const text =
      context && !/^added endpoint|removed endpoint/i.test(cleaned)
        ? `${context}: ${cleaned}`
        : cleaned;
    const lower = cleaned.toLowerCase();
    const type =
      breaking && lower.includes('removed')
        ? 'breaking'
        : lower.includes('added')
          ? 'added'
          : lower.includes('removed')
            ? 'breaking'
            : 'changed';
    changes.push({ type, text });
  }
  return changes;
}

function buildPullRequestBody(
  bundleDate: string,
  includedFiles: AnalyzeOutput['files'],
  skipped: AnalyzeOutput['report']['skipped'],
  errors: AnalyzeOutput['report']['errors'],
): string {
  const sourceLinks = (refs: SourceRef[] | undefined): string => {
    if (!refs || refs.length === 0) return '';
    return refs
      .map((ref) => `[${ref.label}](${ref.url})`)
      .join('<br />')
      .replace(/\|/g, '\\|');
  };

  const lines: Array<string> = [
    `Adds ${includedFiles.length} changelog entries generated on ${bundleDate}.`,
    '',
    '## Generated entries',
    '',
    '| Repo/source | Tag/date | Parser | Entry | Source links |',
    '| --- | --- | --- | --- | --- |',
    ...includedFiles.map((file) => {
      const metadata = file.metadata;
      const source = metadata ? metadata.repo : file.path;
      const tag = metadata?.tag || '';
      const parser = metadata?.parser || 'unknown';
      return `| ${source} | ${tag} | ${parser} | \`${file.path}\` | ${sourceLinks(metadata?.sourceRefs)} |`;
    }),
    '',
    '## Reviewer checklist',
    '',
    '- Confirm generated entries use the normalized changelog format.',
    '- Confirm deleted or skipped releases are no-op entries or older than the latest local entry.',
    '- Confirm parser warnings and errors are actionable.',
    '- Confirm source links point to the upstream release, PR, or commit.',
  ];

  if (skipped.length > 0) {
    lines.push(
      '',
      '## Skipped',
      '',
      '| Repo/tag | Reason | Classification |',
      '| --- | --- | --- |',
      ...skipped.map((item) => {
        const classification = item.emptyOrNoop
          ? 'empty/no-op'
          : item.olderThanLatest
            ? 'older than latest entry'
            : 'skip';
        return `| ${item.repo}${item.tag ? ` ${item.tag}` : ''} | ${item.reason.replace(/\|/g, '\\|')} | ${classification} |`;
      }),
    );
  }

  if (errors.length > 0) {
    lines.push(
      '',
      '## Errors',
      '',
      '| Repo/tag | Stage | Actionable message |',
      '| --- | --- | --- |',
      ...errors.map(
        (item) =>
          `| ${item.repo}${item.tag ? ` ${item.tag}` : ''} | ${item.stage || 'unknown'} | ${item.reason.replace(/\|/g, '\\|')} |`,
      ),
    );
  }

  return lines.join('\n');
}

export function writePreview(
  analyzed: AnalyzeOutput,
  repoRoot: string,
): string {
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

export async function analyze(repoRoot: string): Promise<AnalyzeOutput> {
  const latestDate = getLatestChangelogEntryDate(repoRoot);
  const cfg = loadConfig(repoRoot);
  const octokit = createOctokit();

  const includedFiles: Array<{
    path: string;
    content: string;
    commitMessage: string;
    metadata?: AnalyzeOutput['files'][number]['metadata'];
  }> = [];
  const skipped: AnalyzeOutput['report']['skipped'] = [];
  const errors: AnalyzeOutput['report']['errors'] = [];

  log(`Latest local entry date: ${latestDate ?? 'null'}`);

  const { results: releaseResults, skipped: releaseSkipped } =
    await processAllReleases(octokit, cfg, repoRoot, latestDate);

  skipped.push(...releaseSkipped);

  for (const result of releaseResults) {
    if (result.status === 'ok') {
      includedFiles.push({
        path: result.entry.filePath,
        content: result.entry.content,
        commitMessage: result.entry.commitMessage,
        metadata: result.entry.metadata,
      });
    } else if (result.status === 'skipped') {
      skipped.push({
        owner: result.owner,
        repo: result.repo,
        tag: result.tag,
        decision: 'skip',
        reason: result.reason,
        emptyOrNoop: result.emptyOrNoop,
        olderThanLatest: result.olderThanLatest,
      });
    } else if (result.status === 'error') {
      const parsed = parseReleaseIdentifier(result.error.release);
      errors.push({
        owner: parsed.owner,
        repo: parsed.repo,
        tag: parsed.tag,
        stage: result.error.stage,
        reason: result.error.message,
      });
    }
  }

  try {
    const openapiCfg = cfg.openapi;
    if (
      openapiCfg &&
      openapiCfg.enabled &&
      openapiCfg.repo &&
      Array.isArray(openapiCfg.paths) &&
      openapiCfg.paths.length > 0
    ) {
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

          const contextualChanges = enrichChangesWithContext(
            allChanges,
            baseYaml,
            headYaml,
          );
          const analyzed = analyzeOpenApiChangesWithContext(contextualChanges);

          if (analyzed.categories.size === 0) {
            log(
              `Skipping OpenAPI entry for ${day}: no meaningful changes detected`,
            );
            return null;
          }

          const changeTypes = formatChangeCategories(analyzed.categories);
          const title = `REST API: changes (${changeTypes}) ${day}`;

          const sourceRefs: SourceRef[] = commits.slice(0, 8).map((commit) => ({
            label: `open-api ${commit.sha.slice(0, 7)}`,
            url: `https://github.com/${openapiCfg.repo.owner}/${openapiCfg.repo.repo}/commit/${commit.sha}`,
          }));
          const normalized = {
            release: {
              owner: openapiCfg.repo.owner,
              repo: openapiCfg.repo.repo,
              tag: day,
              url: `https://github.com/${openapiCfg.repo.owner}/${openapiCfg.repo.repo}`,
              publishedAt: day,
              body: analyzed.details.join('\n'),
              category: 'API',
            },
            parser: 'openapi' as const,
            summary: analyzed.summary,
            changes: normalizeOpenApiDetails(
              analyzed.details,
              analyzed.breaking,
            ),
            sourceRefs,
            warnings: [],
          };
          const rendered = renderNormalizedRelease(normalized);

          const content = renderChangelogEntry({
            repoRoot,
            title,
            categories: ['API'],
            summary: rendered.summary,
            detailedContent: rendered.detailedContent,
          });
          const filename = `${day}-rest-api-changes-open-api.md`;
          return {
            path: path.join('changelog', 'entries', filename),
            content,
            commitMessage: `chore(changelog): add REST API changes ${day}`,
            metadata: {
              repo: openapiCfg.repo.repo,
              tag: day,
              parser: 'openapi',
              summary: rendered.summary,
              sourceRefs,
            },
          };
        },
      });
      includedFiles.push(...res.files);
      log(
        `OpenAPI ingest: days=${res.report.days} commits=${res.report.commits} files=${res.files.length} diffToolFailures=${res.report.diffToolFailures}`,
      );
      if (res.report.diffToolFailures > 0) {
        log(
          `Warning: ${res.report.diffToolFailures} OpenAPI diff tool failures occurred`,
        );
      }
      if (res.files.length === 0) {
        skipped.push({
          owner: openapiCfg.repo.owner,
          repo: openapiCfg.repo.repo,
          decision: 'skip',
          reason: 'no new open-api commits',
        });
      }
    }
  } catch (e: any) {
    errors.push({
      owner: DEFAULT_OWNER,
      repo: DEFAULT_OPENAPI_REPO,
      stage: 'fetch',
      reason: e?.message || 'error',
    });
  }

  const bundleDate = today();
  const pr = {
    targetRepo: { owner: cfg.owner, repo: DEFAULT_REPO },
    baseBranch: cfg.baseBranch,
    branchName: `chore/changelog`,
    title: `chore(changelog): ${bundleDate}`,
    body:
      includedFiles.length === 0
        ? 'No new entries.'
        : buildPullRequestBody(bundleDate, includedFiles, skipped, errors),
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
  return token ? `https://x-access-token:${token}@${base}` : `https://${base}`;
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

function runPrettier(filePath: string, cwd: string) {
  const { spawnSync } = require('node:child_process');
  const res = spawnSync(
    'pnpm',
    [
      'prettier',
      '--write',
      '--ignore-path',
      '/dev/null',
      '--parser',
      'mdx',
      filePath,
    ],
    { stdio: 'inherit', cwd, shell: false },
  );
  if (typeof res.status === 'number' && res.status !== 0) {
    logGit(`Warning: prettier failed for ${filePath} with code ${res.status}`);
  }
}

export async function apply(
  repoRoot: string,
  inputPath?: string,
): Promise<void> {
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
  let workdir = providedWorktree
    ? path.resolve(process.env.CHANGELOG_WORKTREE as string)
    : repoRoot;
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
    runGit(
      ['checkout', '-B', data.pr.baseBranch, `origin/${data.pr.baseBranch}`],
      workdir,
    );

    try {
      runGit(
        [
          'config',
          '--local',
          'user.name',
          process.env.GIT_AUTHOR_NAME || 'github-actions[bot]',
        ],
        workdir,
      );
      runGit(
        [
          'config',
          '--local',
          'user.email',
          process.env.GIT_AUTHOR_EMAIL ||
            '41898282+github-actions[bot]@users.noreply.github.com',
        ],
        workdir,
      );
    } catch (err) {
      logGit(`Failed to set git config: ${toErrorMessage(err)}`);
    }

    const octokit = createOctokit();
    const bundleDate = today();
    const branchName = `chore/changelog`;

    let existingPR: PullRequest | null = null;
    let branch = data.pr.branchName;
    let isUpdatingExistingPR = false;

    try {
      existingPR = await findExistingChangelogPR(octokit, {
        owner: data.pr.targetRepo.owner,
        repo: data.pr.targetRepo.repo,
        branchName,
        baseBranch: data.pr.baseBranch,
      });
    } catch (err) {
      logGit(`Failed to check for existing PR: ${toErrorMessage(err)}`);
    }

    // Always use the fixed branch name
    branch = branchName;

    if (existingPR) {
      isUpdatingExistingPR = true;
      logGit(
        `Found existing PR #${existingPR.number} on branch ${branch}, will force-push to update it`,
      );
    } else {
      logGit(`No existing PR found for ${branchName}, creating new branch`);
    }

    // Always create a fresh branch from the base branch
    // This ensures we start clean and will force-push if the branch exists
    try {
      runGit(['checkout', '-B', branch], workdir);
    } catch (err) {
      logGit(`Failed to create branch ${branch}: ${toErrorMessage(err)}`);
      throw err;
    }

    const written: Array<string> = [];
    let commitCount = 0;
    for (const f of data.files) {
      const abs = path.join(workdir, f.path);
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, f.content);

      if (f.path.endsWith('.md')) {
        try {
          runPrettier(f.path, workdir);
        } catch (err) {
          logGit(`Failed to format ${f.path}: ${toErrorMessage(err)}`);
        }
      }

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

    // Force push to overwrite the branch (handles both new and existing branches)
    runGit(['push', '-f', '-u', 'origin', branch], workdir);

    let prUrl: string | null = null;
    let prNumber: number | null = null;
    let status: 'created' | 'updated' = 'created';

    if (isUpdatingExistingPR && existingPR) {
      logGit(`Updating existing PR #${existingPR.number}`);

      try {
        await octokit.rest.pulls.update({
          owner: data.pr.targetRepo.owner,
          repo: data.pr.targetRepo.repo,
          pull_number: existingPR.number,
          title: data.pr.title,
          body: data.pr.body,
        });
        prUrl = existingPR.html_url;
        prNumber = existingPR.number;
        status = 'updated';
      } catch (err) {
        logGit(`Failed to update PR: ${toErrorMessage(err)}`);
        prUrl = existingPR.html_url;
        prNumber = existingPR.number;
        status = 'updated';
      }

      // Re-enable auto-merge in case it was disabled
      try {
        await octokit.graphql(
          `
          mutation EnableAutoMerge($pullRequestId: ID!) {
            enablePullRequestAutoMerge(input: {
              pullRequestId: $pullRequestId,
              mergeMethod: SQUASH
            }) {
              pullRequest { id }
            }
          }
        `,
          { pullRequestId: existingPR.node_id },
        );
        logGit(`Enabled auto-merge for PR #${prNumber}`);
      } catch (err) {
        logGit(`Failed to enable auto-merge: ${toErrorMessage(err)}`);
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

      // Enable auto-merge with squash strategy for new PRs
      try {
        await octokit.graphql(
          `
          mutation EnableAutoMerge($pullRequestId: ID!) {
            enablePullRequestAutoMerge(input: {
              pullRequestId: $pullRequestId,
              mergeMethod: SQUASH
            }) {
              pullRequest { id }
            }
          }
        `,
          { pullRequestId: prRes.data.node_id },
        );
        logGit(`Enabled auto-merge for PR #${prNumber}`);
      } catch (err) {
        logGit(`Failed to enable auto-merge: ${toErrorMessage(err)}`);
      }
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
