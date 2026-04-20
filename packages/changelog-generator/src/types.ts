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

// A single structured change parsed from release notes
export type ParsedChange = {
  method: string; // e.g. "Glean.Client.Chat.Create()"
  field: string; // e.g. "request.chatRequest.messages[].citations[].sourceFile.metadata.status"
  action: 'added' | 'removed' | 'changed' | 'deprecated';
};

// Stage 2 output: pre-processed release
export type PreProcessedRelease = {
  release: RawRelease;
  format: 'speakeasy' | 'plain';
  structuredChanges: ParsedChange[]; // populated for speakeasy format
  cleanedText: string; // always populated, suitable for LLM or heuristic
};

// Stage 3 output: summarized release
export type SummarizedRelease = {
  release: RawRelease;
  summary: string;
  strategy: 'speakeasy-deterministic' | 'llm' | 'heuristic' | 'fallback';
};

// Stage 4 output: rendered entry ready for disk
export type RenderedEntry = {
  filePath: string; // relative, e.g. "changelog/entries/2026-04-13-foo.md"
  content: string; // full markdown with frontmatter
  commitMessage: string;
};

// Validation error with context
export type ValidationError = {
  stage: 'fetch' | 'preprocess' | 'summarize' | 'render';
  release: string; // identifier like "api-client-go v0.11.40"
  message: string;
};

// Discriminated union result for each release
export type ReleaseResult =
  | { status: 'ok'; entry: RenderedEntry }
  | { status: 'skipped'; owner: string; repo: string; reason: string }
  | { status: 'error'; error: ValidationError };
