export type AnalyzeOutput = {
  latestChangelogEntryDate: string | null;
  pr: {
    targetRepo: { owner: string; repo: string };
    baseBranch: string;
    branchName: string;
    title: string;
    body: string;
  };
  files: Array<{
    path: string;
    content: string;
    commitMessage: string;
    metadata?: {
      repo: string;
      tag: string;
      parser: string;
      summary: string;
      sourceRefs: Array<{ label: string; url: string }>;
    };
  }>;
  report: {
    stats: {
      totalProcessed: number;
      includedCount: number;
      skippedCount: number;
      errorCount: number;
    };
    skipped: Array<{
      owner: string;
      repo: string;
      tag?: string;
      decision: string;
      reason: string;
      emptyOrNoop?: boolean;
      olderThanLatest?: boolean;
    }>;
    errors: Array<{
      owner: string;
      repo: string;
      tag?: string;
      stage?: string;
      reason: string;
    }>;
  };
};

export type ReleaseInfo = {
  tag: string;
  url: string;
  publishedAt: string;
  normalizedVersion?: string;
};
