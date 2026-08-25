#!/usr/bin/env tsx

import fs from 'node:fs';
import path from 'node:path';
import { appendFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { enrichChangesWithContext } from '../packages/changelog-generator/src/openapi-context';
import { runOpenApiChanges } from '../packages/changelog-generator/src/openapi-changes-runner';
import {
  analyzeOpenApiChanges,
  analyzeOpenApiChangesWithContext,
} from '../packages/changelog-generator/src/openapi-summary';

export const OPENAPI_SPECS = [
  {
    name: 'Client',
    path: 'openapi/client/client-capitalized.yaml',
  },
  {
    name: 'Indexing',
    path: 'openapi/indexing/indexing-capitalized.yaml',
  },
  {
    name: 'Platform',
    path: 'openapi/platform/platform-capitalized.yaml',
  },
] as const;

type Change = Record<string, any>;

type SpecReport = {
  name: string;
  path: string;
  status: 'unchanged' | 'changed' | 'failed';
  summary: string;
  details: string[];
  contractChanges: number;
  breaking: boolean;
  rawChangeCount: number;
  error?: string;
};

type GeneratedFileSummary = {
  total: number;
  byDirectory: Array<{ directory: string; count: number }>;
};

export type DiffSummary = Pick<
  SpecReport,
  | 'status'
  | 'summary'
  | 'details'
  | 'contractChanges'
  | 'breaking'
  | 'rawChangeCount'
>;

const NON_CONTRACT_PROPERTIES = [
  'contact',
  'description',
  'externaldocs',
  'info',
  'license',
  'summary',
  'tags',
  'title',
] as const;

function getChanges(diff: any): Change[] {
  if (Array.isArray(diff?.changes)) return diff.changes;

  const changes: Change[] = [];
  for (const changeType of ['added', 'changed', 'removed']) {
    for (const change of Array.isArray(diff?.[changeType])
      ? diff[changeType]
      : []) {
      changes.push({
        ...change,
        changeType,
      });
    }
  }
  return changes;
}

function hasMeaningfulChanges(diff: any): boolean {
  return (
    getChanges(diff).length > 0 ||
    Boolean(diff?.paths || diff?.components || diff?.schemas)
  );
}

function isContractChange(change: Change): boolean {
  const property = String(change.property || '').toLowerCase();
  const type = String(change.type || change.kind || '').toLowerCase();

  if (
    NON_CONTRACT_PROPERTIES.some(
      (nonContractProperty) =>
        property === nonContractProperty ||
        property.endsWith(`.${nonContractProperty}`),
    )
  ) {
    return false;
  }

  if (['info', 'tag', 'contact', 'license'].includes(type)) return false;

  // Be conservative for properties we do not recognize: a newly introduced
  // OpenAPI change should not be silently auto-merged.
  return true;
}

function changeType(change: Change): 'added' | 'removed' | 'modified' {
  const explicitType = String(change.changeType || '').toLowerCase();
  if (explicitType === 'added' || explicitType === 'removed') {
    return explicitType;
  }

  const text = String(change.changeText || '').toLowerCase();
  if (text.includes('added')) return 'added';
  if (text.includes('removed')) return 'removed';
  return 'modified';
}

function changeLabel(change: Change): string {
  const type = changeType(change);
  const action = type[0].toUpperCase() + type.slice(1);
  const value = change.value || {};
  const kind = String(change.type || change.kind || '').toLowerCase();
  const pathValue = value.path || value.url || value.name || value.id;
  const method = String(value.method || value.verb || '').toUpperCase();
  const breaking = change.breaking === true ? ' (breaking change)' : '';

  if (kind === 'operation' && method && pathValue) {
    return `${action} operation: ${method} ${pathValue}${breaking}`;
  }
  if (kind === 'pathitem' && pathValue) {
    return `${action} path: ${pathValue}${breaking}`;
  }
  if (kind === 'schema' && value.name) {
    return `${action} schema: ${value.name}${breaking}`;
  }
  if (kind === 'parameter' && value.name) {
    const location = value.in ? ` (${value.in})` : '';
    return `${action} parameter: ${value.name}${location}${breaking}`;
  }

  const property = String(change.property || change.type || 'specification');
  const rawValue = change.new ?? change.original ?? change.value;
  const valueText =
    typeof rawValue === 'string'
      ? rawValue
      : rawValue
        ? JSON.stringify(rawValue)
        : '';

  if (valueText) return `${action} ${property}: ${valueText}${breaking}`;
  if (change.changeText) return `${action}: ${change.changeText}${breaking}`;
  return `${action} ${property}${breaking}`;
}

export function summarizeDiff(
  diff: any,
  baseYaml: string,
  headYaml: string,
): DiffSummary {
  const changes = getChanges(diff);
  if (changes.length === 0) {
    return {
      status: hasMeaningfulChanges(diff) ? 'changed' : 'unchanged',
      summary: hasMeaningfulChanges(diff)
        ? 'Unclassified OpenAPI changes detected'
        : 'No OpenAPI changes',
      details: [],
      contractChanges: hasMeaningfulChanges(diff) ? 1 : 0,
      breaking: false,
      rawChangeCount: 0,
    };
  }

  const contextualChanges = enrichChangesWithContext(
    changes,
    baseYaml,
    headYaml,
  );
  const contextual = analyzeOpenApiChangesWithContext(contextualChanges);
  const raw = analyzeOpenApiChanges({ changes });
  const contractChanges = changes.filter(isContractChange).length;
  const breaking = changes.some((change) => change.breaking === true);

  const contextualDetails = contextual.details.filter(Boolean);
  const rawDetails = changes.map(changeLabel).filter(Boolean);
  const details =
    contextualDetails.length > 0
      ? [
          ...contextualDetails,
          ...rawDetails.filter((detail) => !contextualDetails.includes(detail)),
        ]
      : rawDetails;

  if (contractChanges === 0) {
    return {
      status: 'changed',
      summary: `${changes.length} documentation metadata change${changes.length === 1 ? '' : 's'}`,
      details: details.length > 0 ? details : changes.map(changeLabel),
      contractChanges: 0,
      breaking,
      rawChangeCount: changes.length,
    };
  }

  const unmappedCount = Math.max(0, contractChanges - contextualChanges.length);
  const extraDetail =
    unmappedCount > 0
      ? [
          `${unmappedCount} additional API change${unmappedCount === 1 ? '' : 's'} detected`,
        ]
      : [];

  return {
    status: 'changed',
    summary: contextualChanges.length > 0 ? contextual.summary : raw.summary,
    details:
      details.length > 0
        ? [...details, ...extraDetail]
        : changes.map(changeLabel),
    contractChanges,
    breaking: breaking || contextual.breaking,
    rawChangeCount: changes.length,
  };
}

function getGitHeadFile(filePath: string): string {
  const result = spawnSync('git', ['show', `HEAD:${filePath}`], {
    encoding: 'utf8',
    maxBuffer: 100 * 1024 * 1024,
  });
  if (result.status !== 0) {
    throw new Error(result.stderr?.trim() || `Unable to read HEAD:${filePath}`);
  }
  return result.stdout;
}

function getChangedFiles(): string[] {
  const result = spawnSync(
    'git',
    ['status', '--porcelain', '--untracked-files=all'],
    {
      encoding: 'utf8',
    },
  );
  if (result.status !== 0) return [];

  return result.stdout
    .split('\n')
    .filter(Boolean)
    .map((line) => line.slice(3).trim())
    .filter(Boolean);
}

function summarizeGeneratedFiles(files: string[]): GeneratedFileSummary {
  const directories = new Map<string, number>();
  for (const file of files) {
    const directory = file.split('/')[0] || file;
    directories.set(directory, (directories.get(directory) || 0) + 1);
  }

  return {
    total: files.length,
    byDirectory: Array.from(directories.entries())
      .map(([directory, count]) => ({ directory, count }))
      .sort(
        (a, b) => b.count - a.count || a.directory.localeCompare(b.directory),
      ),
  };
}

function renderSpecReport(report: SpecReport): string[] {
  const status =
    report.status === 'failed'
      ? '⚠️'
      : report.status === 'changed'
        ? '📝'
        : '✅';
  const contract =
    report.status === 'failed'
      ? 'unknown'
      : report.contractChanges === 0
        ? 'no'
        : `${report.contractChanges}`;
  const breaking = report.breaking ? 'yes' : 'no';

  const lines = [
    `### ${status} ${report.name} — \`${report.path}\``,
    '',
    `- **Summary:** ${report.summary}`,
    `- **API-surface changes:** ${contract}`,
    `- **Breaking changes:** ${breaking}`,
  ];

  if (report.error) lines.push(`- **Analyzer error:** ${report.error}`);

  if (report.details.length > 0) {
    lines.push('', '<details>', '<summary>Details</summary>', '');
    lines.push(...report.details.map((detail) => `- ${detail}`));
    lines.push('', '</details>');
  }

  return lines;
}

export function renderReport(
  reports: SpecReport[],
  generatedFiles: GeneratedFileSummary,
  metadata: {
    reason?: string;
    actor?: string;
    runUrl?: string;
  } = {},
): string {
  const hasFailure = reports.some((report) => report.status === 'failed');
  const hasContractChange = reports.some(
    (report) => report.contractChanges > 0,
  );
  const hasBreakingChange = reports.some((report) => report.breaking);
  const mergeStatus =
    hasFailure || hasContractChange
      ? 'Manual review required'
      : 'Eligible for auto-merge after CI passes';

  const lines = [
    '## 🔄 OpenAPI Documentation Regeneration',
    '',
    `**Trigger reason:** ${metadata.reason || 'Manual trigger'}`,
    `**Triggered by:** ${metadata.actor || 'unknown'}`,
  ];
  if (metadata.runUrl)
    lines.push(`**Run ID:** [GitHub Actions run](${metadata.runUrl})`);

  lines.push(
    '',
    `### Merge status: ${mergeStatus}`,
    '',
    hasFailure
      ? 'The semantic diff could not be completed. This PR will not be auto-merged.'
      : hasContractChange
        ? 'API-surface changes were detected. Please review the details before merging.'
        : 'No API-surface changes were detected; the generated-only change can be auto-merged after CI passes.',
    '',
    `- **Breaking changes:** ${hasBreakingChange ? 'yes' : 'no'}`,
    `- **Generated files changed:** ${generatedFiles.total}`,
    '',
    '### Semantic delta',
    '',
  );

  for (const report of reports) lines.push(...renderSpecReport(report), '');

  lines.push(
    '### Regeneration steps',
    '',
    '- Downloaded the latest OpenAPI specs from GitHub Pages',
    '- Applied the repository OpenAPI transformations',
    '- Regenerated the API documentation',
    '- Removed generated files that are no longer needed',
    '',
    '### Generated files by top-level directory',
    '',
  );

  if (generatedFiles.byDirectory.length === 0) {
    lines.push('- No changed files reported');
  } else {
    for (const { directory, count } of generatedFiles.byDirectory) {
      lines.push(`- \`${directory}/\`: ${count} file${count === 1 ? '' : 's'}`);
    }
  }

  lines.push(
    '',
    '> The semantic delta above is the source of truth for the API change. The complete generated diff is available in the Files changed tab.',
    '',
  );

  return lines.join('\n');
}

function setGitHubOutput(name: string, value: string): void {
  const outputPath = process.env.GITHUB_OUTPUT;
  if (outputPath) appendFileSync(outputPath, `${name}=${value}\n`);
}

function parseOutputPath(args: string[]): string {
  const outputIndex = args.indexOf('--output');
  if (outputIndex === -1 || !args[outputIndex + 1]) {
    throw new Error('Usage: openapi-diff-report --output <path>');
  }
  return path.resolve(args[outputIndex + 1]);
}

export function main(outputPath: string): void {
  const reports: SpecReport[] = [];

  for (const spec of OPENAPI_SPECS) {
    try {
      const baseYaml = getGitHeadFile(spec.path);
      const headYaml = fs.readFileSync(spec.path, 'utf8');

      if (baseYaml === headYaml) {
        reports.push({
          name: spec.name,
          path: spec.path,
          status: 'unchanged',
          summary: 'No OpenAPI changes',
          details: [],
          contractChanges: 0,
          breaking: false,
          rawChangeCount: 0,
        });
        continue;
      }

      const diff = runOpenApiChanges(baseYaml, headYaml);
      if (diff === null) {
        reports.push({
          name: spec.name,
          path: spec.path,
          status: 'failed',
          summary: 'Unable to analyze OpenAPI changes',
          details: [],
          contractChanges: 0,
          breaking: false,
          rawChangeCount: 0,
          error: 'openapi-changes returned no valid JSON report',
        });
        continue;
      }

      reports.push({
        name: spec.name,
        path: spec.path,
        ...summarizeDiff(diff, baseYaml, headYaml),
      });
    } catch (error) {
      reports.push({
        name: spec.name,
        path: spec.path,
        status: 'failed',
        summary: 'Unable to analyze OpenAPI changes',
        details: [],
        contractChanges: 0,
        breaking: false,
        rawChangeCount: 0,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const generatedFiles = summarizeGeneratedFiles(getChangedFiles());
  const report = renderReport(reports, generatedFiles, {
    reason: process.env.OPENAPI_TRIGGER_REASON,
    actor: process.env.GITHUB_ACTOR,
    runUrl:
      process.env.GITHUB_SERVER_URL &&
      process.env.GITHUB_REPOSITORY &&
      process.env.GITHUB_RUN_ID
        ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
        : undefined,
  });

  writeFileSync(outputPath, report);

  const hasFailure = reports.some((item) => item.status === 'failed');
  const hasContractChange = reports.some((item) => item.contractChanges > 0);
  setGitHubOutput('has_semantic_changes', String(hasContractChange));
  setGitHubOutput(
    'has_breaking_changes',
    String(reports.some((item) => item.breaking)),
  );
  setGitHubOutput('diff_failed', String(hasFailure));
}

const invokedScript = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
  : false;

if (invokedScript) main(parseOutputPath(process.argv.slice(2)));
