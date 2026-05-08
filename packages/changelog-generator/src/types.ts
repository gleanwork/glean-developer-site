// Stage 1 output: raw release data from GitHub
export type RawRelease = {
  owner: string;
  repo: string;
  tag: string;
  url: string;
  publishedAt: string; // ISO date string YYYY-MM-DD
  body: string; // raw release notes markdown
  category: string; // from config, e.g. "API Clients"
};

export type ReleaseParser =
  | 'auto'
  | 'speakeasy'
  | 'commitizen'
  | 'lerna-changelog'
  | 'openapi'
  | 'plain'
  | 'legacy';

export type ChangeType =
  | 'breaking'
  | 'added'
  | 'fixed'
  | 'changed'
  | 'deprecated'
  | 'docs'
  | 'internal';

export type SourceRef = {
  label: string;
  url: string;
};

export type NormalizedChange = {
  type: ChangeType;
  text: string;
  sourceRefs?: SourceRef[];
};

export type NormalizedRelease = {
  release: RawRelease;
  parser: ReleaseParser;
  summary: string;
  changes: NormalizedChange[];
  sourceRefs: SourceRef[];
  warnings: string[];
  isEmpty?: boolean;
};

// A single structured change parsed from release notes
export type ParsedChange = {
  method: string; // e.g. "Glean.Client.Chat.Create()"
  field: string; // e.g. "request.chatRequest.messages[].citations[].sourceFile.metadata.status"
  action: 'added' | 'removed' | 'changed' | 'deprecated';
};

// Stage 4 output: rendered entry ready for disk
export type RenderedEntry = {
  filePath: string; // relative, e.g. "changelog/entries/2026-04-13-foo.md"
  content: string; // full markdown with frontmatter
  commitMessage: string;
  metadata?: {
    repo: string;
    tag: string;
    parser: ReleaseParser;
    summary: string;
    sourceRefs: SourceRef[];
  };
};

// Validation error with context
export type ValidationError = {
  stage: 'fetch' | 'parse' | 'render';
  release: string; // identifier like "api-client-go v0.11.40"
  message: string;
};

// Discriminated union result for each release
export type ReleaseResult =
  | { status: 'ok'; entry: RenderedEntry }
  | {
      status: 'skipped';
      owner: string;
      repo: string;
      tag?: string;
      reason: string;
      emptyOrNoop?: boolean;
      olderThanLatest?: boolean;
    }
  | { status: 'error'; error: ValidationError };
