import * as fs from 'node:fs';
import * as path from 'node:path';
import yaml from 'js-yaml';

export type RepoSpec = {
  owner: string;
  repo: string;
  category: string;
};

export type GeneratorConfig = {
  owner: string;
  baseBranch: string;
  repos: Array<RepoSpec>;
  summarization: {
    mode: 'off' | 'heuristic' | 'llm';
    maxBullets: number;
    maxChars: number;
    model?: string;
    categoryHints: Record<string, Array<string>>;
  };
  openapi?: {
    enabled: boolean;
    repo: { owner: string; repo: string };
    paths: Array<string>;
    lookbackDays: number;
    diffEnabled?: boolean;
    diffBin?: string;
    diffEngine?: 'pb33f' | 'none';
  };
};

export function loadConfig(repoRoot: string): GeneratorConfig {
  const envPath = process.env.CHANGELOG_CONFIG_PATH
    ? path.resolve(process.env.CHANGELOG_CONFIG_PATH)
    : path.join(repoRoot, 'packages', 'changelog-generator', 'config.yml');

  if (!fs.existsSync(envPath)) {
    throw new Error(`Config not found at ${envPath}. Set CHANGELOG_CONFIG_PATH or add config.yml.`);
  }

  const raw = fs.readFileSync(envPath, 'utf-8');
  const data = yaml.load(raw) as any;

  const owner = (data?.owner ? String(data.owner) : 'gleanwork').trim();
  const baseBranch = (data?.baseBranch ? String(data.baseBranch) : 'main').trim();
  const repos: Array<RepoSpec> = Array.isArray(data?.repos)
    ? (data.repos as Array<any>).map((r) => ({
        owner,
        repo: String(r.repo),
        category: String(r.category),
      }))
    : [];

  if (repos.length === 0) {
    throw new Error('Config repos is empty; add at least one repo entry.');
  }

  const s = data?.summarization || {};
  const envSummarizeRaw = process.env.CHANGELOG_SUMMARIZE;
  const envSummarize = typeof envSummarizeRaw === 'string'
    ? /^(1|true|yes|on)$/i.test(envSummarizeRaw)
    : undefined;
  let mode: 'off' | 'heuristic' | 'llm';
  const rawMode = s?.mode ? String(s.mode) : undefined;
  if (envSummarize !== undefined) {
    mode = envSummarize ? 'llm' : 'heuristic';
  } else if (rawMode === 'off' || rawMode === 'heuristic' || rawMode === 'llm') {
    mode = rawMode;
  } else {
    mode = 'heuristic';
  }
  const summarization = {
    mode,
    maxBullets: Number.isFinite(s.maxBullets) ? Number(s.maxBullets) : 3,
    maxChars: Number.isFinite(s.maxChars) ? Number(s.maxChars) : 300,
    model: process.env.CHANGELOG_OPENAI_MODEL || s.model || 'gpt-4o-mini',
    categoryHints: (s.categoryHints as Record<string, Array<string>>) || {},
  };

  // openapi block (optional)
  let openapi: GeneratorConfig['openapi'] | undefined = undefined;
  const ocfg = (data as any)?.openapi;
  if (ocfg && typeof ocfg === 'object') {
    const enabled = Boolean(ocfg.enabled);
    if (enabled) {
      const repoObj = ocfg.repo || {};
      const repoOwner = String(repoObj.owner || owner);
      const repoName = String(repoObj.repo || 'open-api');
      const paths = Array.isArray(ocfg.paths) ? ocfg.paths.map((p: any) => String(p)) : [];
      const lookbackDays = Number.isFinite(ocfg.lookbackDays) ? Number(ocfg.lookbackDays) : 30;
      const diffEnabled = typeof ocfg.diffEnabled === 'boolean' ? ocfg.diffEnabled : undefined;
      const diffBin = typeof ocfg.diffBin === 'string' ? String(ocfg.diffBin) : undefined;
      const diffEngine = ocfg.diffEngine === 'none' ? 'none' : (ocfg.diffEngine === 'pb33f' ? 'pb33f' : undefined);
      if (paths.length > 0) {
        openapi = {
          enabled: true,
          repo: { owner: repoOwner, repo: repoName },
          paths,
          lookbackDays,
          diffEnabled,
          diffBin,
          diffEngine,
        };
      }
    }
  }

  return { owner, baseBranch, repos, summarization, openapi };
}


