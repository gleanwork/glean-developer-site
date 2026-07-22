/** Canned, fictional engineering-portal data rendered by the Web SDK mocks.
 * Mirrors the cookbook's engineering-portal story (services, runbooks,
 * ownership, on-call) so the previews and the recipes tell one story.
 * Nothing here touches a Glean backend.
 *
 * Composition is fidelity-checked against real widget captures taken via
 * scripts/websdk-harness (2026-07-21, SDK 2.4.0). */

export const PORTAL_URL = 'portal.internal/engineering';

export const DEMO_QUERY = 'payments service runbook';

/** The real search box's placeholder text. */
export const DEMO_PLACEHOLDER = 'Search for anything at Glean';

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
    meta: 'Priya Natarajan · Updated 2 days ago · Engineering Wiki',
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
    meta: 'Marcus Webb · Yesterday',
    snippet: {
      pre: 'The alarm cleared after we rolled back — updating the ',
      match: 'runbook',
      post: ' with the new dashboard links…',
    },
  },
];

/** Document suggestions shown in the autocomplete card. */
export const DEMO_DOC_SUGGESTIONS = [
  {
    title: 'Payments Service — Deploy & Rollback Runbook',
    source: 'confluence' as SourceKey,
    meta: 'Engineering Wiki · Updated 2 days ago',
  },
  {
    title: 'payments-service',
    source: 'github' as SourceKey,
    meta: 'git.internal/payments-service · 1mo ago',
  },
];

/** Filter-operator hint rows, as the real autocomplete shows them. */
export const DEMO_FILTER_HINTS = [
  { chip: 'from:', hint: 'teammate' },
  { chip: 'type:', hint: 'bug, document, message, etc.' },
  { chip: 'updated:', hint: 'today, past_week, etc.' },
  { chip: 'app:', hint: 'Drive, Jira, etc.' },
];

/** Filter chips shown above real search results. */
export const DEMO_RESULT_CHIPS = ['All filters', 'From: me', 'Updated'];

export const DEMO_CHAT = {
  title: 'Who owns the payments service?',
  answer: [
    'The payments service is owned by the Payments Platform team.',
    'Priya Natarajan is the tech lead, and Marcus Webb is on call this week — the deploy and rollback runbook lives in the Engineering Wiki.',
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
  { name: 'GitHub', source: 'github' as SourceKey, connected: true },
  { name: 'Jira', source: 'jira' as SourceKey, connected: true },
  { name: 'Slack', source: 'slack' as SourceKey, connected: false },
  { name: 'Confluence', source: 'confluence' as SourceKey, connected: false },
];
