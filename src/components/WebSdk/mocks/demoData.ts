/** Canned, fictional engineering-portal data rendered by the Web SDK mocks.
 * Mirrors the cookbook's engineering-portal story (services, runbooks,
 * ownership, on-call) so the previews and the recipes tell one story.
 * Nothing here touches a Glean backend. */

export const PORTAL_URL = 'portal.internal/engineering';

export const DEMO_QUERY = 'payments service runbook';

export type SourceKey = 'confluence' | 'github' | 'slack' | 'jira' | 'people';

export const SOURCE_LABELS: Record<SourceKey, string> = {
  confluence: 'Confluence',
  github: 'GitHub',
  slack: 'Slack',
  jira: 'Jira',
  people: 'People',
};

export interface DemoResult {
  title: string;
  source: SourceKey;
  meta: string;
  /** Snippet split around the term that matches the demo query. */
  snippet: { pre: string; match: string; post: string };
}

export const DEMO_RESULTS: DemoResult[] = [
  {
    title: 'Payments Service — Deploy & Rollback Runbook',
    source: 'confluence',
    meta: 'Engineering Wiki · Updated 2 days ago',
    snippet: {
      pre: 'Canary the ',
      match: 'payments service',
      post: ' behind the feature gate, then promote once error rates hold under 0.1% for 15 minutes…',
    },
  },
  {
    title: 'payments-service',
    source: 'github',
    meta: 'Repository · 42 open pull requests',
    snippet: {
      pre: 'Owns charge creation, refunds, and ledger writes. See the ',
      match: 'runbook',
      post: ' before deploying to production…',
    },
  },
  {
    title: '#payments-oncall — canary alarm follow-up',
    source: 'slack',
    meta: 'Thread · Yesterday',
    snippet: {
      pre: 'The alarm cleared after we rolled back — updating the ',
      match: 'runbook',
      post: ' with the new dashboard links…',
    },
  },
];

export const DEMO_SUGGESTIONS = [
  { text: 'payments service runbook', kind: 'search' as const },
  { text: 'who owns the payments service?', kind: 'ai' as const },
  {
    text: 'Payments Service — Deploy & Rollback Runbook',
    kind: 'doc' as const,
  },
  { text: 'checkout on-call schedule', kind: 'search' as const },
];

export const DEMO_TABS = ['All', 'Confluence', 'GitHub', 'Slack', 'Jira'];

export const DEMO_CHAT = {
  question: 'Who owns the payments service?',
  answer: [
    'The payments service is owned by the Payments Platform team.',
    'Priya Natarajan is the tech lead, and Marcus Webb is on call this week.',
  ],
  citations: [
    { title: 'payments-service · CODEOWNERS', source: 'github' as SourceKey },
    { title: 'On-call schedule — Payments', source: 'confluence' as SourceKey },
  ],
};

export const DEMO_RECOMMENDATIONS = [
  {
    title: 'Checkout — On-call Runbook',
    source: 'confluence' as SourceKey,
    meta: 'Updated 4 days ago',
  },
  {
    title: 'PAY-2114: Canary alarms during deploy',
    source: 'jira' as SourceKey,
    meta: 'In review',
  },
  {
    title: 'Priya Natarajan — Payments Platform',
    source: 'people' as SourceKey,
    meta: 'Tech lead',
  },
];

export const DEMO_DATASOURCES = [
  {
    name: 'GitHub',
    detail: 'Pull requests and code review activity',
    connected: true,
  },
  {
    name: 'Slack',
    detail: 'Private channels and direct messages',
    connected: false,
  },
  { name: 'Jira', detail: 'Issues assigned to you', connected: false },
];
