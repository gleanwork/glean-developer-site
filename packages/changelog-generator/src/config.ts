import * as fs from 'node:fs';
import * as path from 'node:path';
import yaml from 'js-yaml';
import type { ReleaseParser } from './types.js';

const DEFAULT_OWNER = 'gleanwork';
const DEFAULT_BASE_BRANCH = 'main';
const DEFAULT_OPENAPI_REPO = 'open-api';

export type RepoSpec = {
  owner: string;
  repo: string;
  category: string;
  parser: ReleaseParser;
};

export type GeneratorConfig = {
  owner: string;
  baseBranch: string;
  repos: Array<RepoSpec>;
  openapi?: {
    enabled: boolean;
    repo: { owner: string; repo: string };
    paths: Array<string>;
    lookbackDays: number;
    diffEnabled?: boolean;
    diffBin?: string;
    diffEngine?: 'openapi-changes' | 'none';
  };
};

export function loadConfig(repoRoot: string): GeneratorConfig {
  const envPath = process.env.CHANGELOG_CONFIG_PATH
    ? path.resolve(process.env.CHANGELOG_CONFIG_PATH)
    : path.join(repoRoot, 'packages', 'changelog-generator', 'config.yml');

  if (!fs.existsSync(envPath)) {
    throw new Error(
      `Config not found at ${envPath}. Set CHANGELOG_CONFIG_PATH or add config.yml.`,
    );
  }

  const raw = fs.readFileSync(envPath, 'utf-8');
  const data = yaml.load(raw) as any;

  const owner = (data?.owner ? String(data.owner) : DEFAULT_OWNER).trim();
  const baseBranch = (
    data?.baseBranch ? String(data.baseBranch) : DEFAULT_BASE_BRANCH
  ).trim();
  const repos: Array<RepoSpec> = Array.isArray(data?.repos)
    ? (data.repos as Array<any>).map((r, idx) => {
        if (!r.repo) {
          throw new Error(
            `Config repos[${idx}] missing required 'repo' field: ${JSON.stringify(r)}`,
          );
        }
        if (!r.category) {
          throw new Error(
            `Config repos[${idx}] missing required 'category' field: ${JSON.stringify(r)}`,
          );
        }
        return {
          owner,
          repo: String(r.repo),
          category: String(r.category),
          parser: parseReleaseParser(r.parser),
        };
      })
    : [];

  if (repos.length === 0) {
    throw new Error('Config repos is empty; add at least one repo entry.');
  }

  // openapi block (optional)
  let openapi: GeneratorConfig['openapi'] | undefined = undefined;
  const ocfg = (data as any)?.openapi;
  if (ocfg && typeof ocfg === 'object') {
    const enabled = Boolean(ocfg.enabled);
    if (enabled) {
      const repoObj = ocfg.repo || {};
      const repoOwner = String(repoObj.owner || owner);
      const repoName = String(repoObj.repo || DEFAULT_OPENAPI_REPO);
      const paths = Array.isArray(ocfg.paths)
        ? ocfg.paths.map((p: any) => String(p))
        : [];
      const lookbackDays = Number.isFinite(ocfg.lookbackDays)
        ? Number(ocfg.lookbackDays)
        : 30;
      const diffEnabled =
        typeof ocfg.diffEnabled === 'boolean' ? ocfg.diffEnabled : undefined;
      const diffBin =
        typeof ocfg.diffBin === 'string' ? String(ocfg.diffBin) : undefined;
      const diffEngine =
        ocfg.diffEngine === 'none'
          ? 'none'
          : ocfg.diffEngine === 'openapi-changes'
            ? 'openapi-changes'
            : undefined;
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

  return { owner, baseBranch, repos, openapi };
}

function parseReleaseParser(value: unknown): ReleaseParser {
  const parser = value ? String(value) : 'auto';
  if (
    parser === 'auto' ||
    parser === 'speakeasy' ||
    parser === 'commitizen' ||
    parser === 'lerna-changelog' ||
    parser === 'openapi' ||
    parser === 'plain' ||
    parser === 'legacy'
  ) {
    return parser;
  }
  throw new Error(`Unknown changelog parser '${parser}' in config.yml`);
}
