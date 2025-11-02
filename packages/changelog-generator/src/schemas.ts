export type AnalyzeOutput = {
  latestChangelogEntryDate: string | null;
  pr: {
    targetRepo: { owner: string; repo: string };
    baseBranch: string;
    branchName: string;
    title: string;
    body: string;
  };
  files: Array<{ path: string; content: string; commitMessage: string }>;
  openapi?: {
    latestProcessedSha: string | null;
  };
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
      decision: string;
      reason: string;
    }>;
    errors: Array<{ owner: string; repo: string; reason: string }>;
  };
};

export type ReleaseInfo = {
  tag: string;
  url: string;
  publishedAt: string;
  normalizedVersion?: string;
};


