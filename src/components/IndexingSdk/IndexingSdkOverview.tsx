import React from 'react';
import Link from '@docusaurus/Link';
import TerminalPanel from '../home/TerminalPanel';
import AgentInstall from './AgentInstall';
import {
  ConnectorPipeline,
  ConnectorMatrix,
  CONNECTOR_TYPES,
  PhaseCards,
  Stages,
  TESTING_PHASES,
  icon,
} from './diagrams';
import { tintSession } from './tintSession';
import styles from './styles.module.css';

const HERO_CODE = `$ claude plugin marketplace add gleanwork/glean-indexing-sdk
✔ Added marketplace: glean-indexing-sdk

$ claude plugin install glean-connector-builder@glean-indexing-sdk
✔ Installed: glean-connector-builder

> Build a connector for our internal wiki at wiki.acme.com.
  It has a REST API with cursor pagination and per-page ACLs.

● Reading the wiki API docs
● Confirmed scope: 12,400 pages, 3 permission groups
● Generating connector.py, data_client.py, tests
● Phase 1 tests: 8 passed, 0 failed
● Ready to index — run it when you are`;

const PROMPTS = [
  'I want to push my Webex data to Glean. Build a connector for me.',
  'Build a connector for our internal wiki at wiki.acme.com. It has a REST API with cursor pagination, and each page carries a list of groups that can read it.',
];

/** The skills that coordinate the build, in roughly the order they run. */
const SKILLS: { name: string; covers: string }[] = [
  {
    name: 'connector-builder',
    covers: 'Top-level workflow coordinating the rest.',
  },
  {
    name: 'connector-api-exploration',
    covers: "Reading and confirming the source's API documentation.",
  },
  {
    name: 'connector-auth',
    covers: 'Authentication patterns for source systems.',
  },
  {
    name: 'connector-pull',
    covers: 'Data clients, pagination, rate limiting.',
  },
  { name: 'connector-push', covers: 'Uploading documents and identities.' },
  { name: 'connector-testing', covers: 'The three-phase testing workflow.' },
  { name: 'connector-observability', covers: 'Logging and metrics wiring.' },
  {
    name: 'connector-deployment',
    covers: 'Generating and applying deployment artifacts.',
  },
];

const AGENT_STAGES = [
  {
    owner: 'you' as const,
    title: <>Describe the source</>,
    body: (
      <>
        Plain language is enough: what system, what content, and who should be
        able to see it.
      </>
    ),
  },
  {
    owner: 'sdk' as const,
    title: <>Explore the API</>,
    body: (
      <>
        Reads the source&apos;s documentation to establish endpoints, auth,
        pagination, and where permissions live.
      </>
    ),
  },
  {
    owner: 'you' as const,
    title: <>Confirm the plan</>,
    body: (
      <>
        Scope, connector type, and permission model come back for your approval
        before any code is written.
      </>
    ),
  },
  {
    owner: 'sdk' as const,
    title: <>Generate</>,
    body: (
      <>
        Writes the data client and connector against this SDK, including
        pagination, rate limiting, and ACL mapping.
      </>
    ),
  },
  {
    owner: 'sdk' as const,
    title: <>Test</>,
    body: (
      <>
        Runs the mocked phase, then the real-source phase against recorded
        fixtures — before anything is uploaded to Glean.
      </>
    ),
  },
  {
    owner: 'you' as const,
    title: <>Review, then index</>,
    body: (
      <>
        Check the review items below, then run a full crawl and confirm
        documents are searchable.
      </>
    ),
  },
];

const REVIEW_ITEMS = [
  {
    name: 'Permissions',
    desc: 'Are real ACLs attached, and does get_identities() push the users and groups they reference? An allow-all default is the most consequential thing to miss.',
    href: '/libraries/indexing-sdk/permissions',
    icon: 'Lock',
  },
  {
    name: 'Full-crawl completeness',
    desc: 'Does the data client raise on a failed page rather than returning what it has? A short result set deletes documents as stale.',
    href: '/libraries/indexing-sdk/push/error-handling',
    icon: 'AlertTriangle',
  },
  {
    name: 'Timestamps',
    desc: 'created_at and updated_at must be epoch seconds, not ISO strings. This fails silently — documents just sort wrong.',
    href: '/libraries/indexing-sdk/quickstart',
    icon: 'Clock',
  },
  {
    name: 'Rate limiting',
    desc: "Configured against your source's real quota, not left at the conservative default of one retry.",
    href: '/libraries/indexing-sdk/pull/rate-limiting',
    icon: 'Activity',
  },
  {
    name: 'Incremental crawls',
    desc: 'If it claims incremental support, does it override _get_last_crawl_timestamp()? Without that, since is always None.',
    href: '/libraries/indexing-sdk/concepts/indexing-modes',
    icon: 'Repeat',
  },
  {
    name: 'Run the real tests',
    desc: 'Generated code is written against the API docs. Phase 2 checks it against what the source actually returns.',
    href: '/libraries/indexing-sdk/testing/integration',
    icon: 'CheckCircle',
  },
];

interface Capability {
  name: string;
  desc: string;
  api?: string;
  href: string;
  icon: string;
}

const CAPABILITIES: Capability[] = [
  {
    name: 'Connector types',
    desc: 'Four base classes: in-memory, sync streaming, async streaming, and people.',
    href: '/libraries/indexing-sdk/concepts/connector-types',
    icon: 'GitBranch',
  },
  {
    name: 'Pull integrations',
    desc: 'HTTP client with retries and backoff, three pagination modes, token-bucket rate limiting.',
    api: 'PullHttpClient',
    href: '/libraries/indexing-sdk/pull/http-client',
    icon: 'Download',
  },
  {
    name: 'Push & indexing',
    desc: 'Documents, users, groups, memberships, employees — batched and uploaded in parallel.',
    api: 'PushUploader',
    href: '/libraries/indexing-sdk/push/uploader',
    icon: 'Upload',
  },
  {
    name: 'Permissions',
    desc: 'Per-document ACLs plus the identity graph that makes them evaluate.',
    href: '/libraries/indexing-sdk/permissions',
    icon: 'Lock',
  },
  {
    name: 'Testing',
    desc: 'Three phases: fully mocked, real-source record and replay, and live end-to-end.',
    api: 'TestHarness',
    href: '/libraries/indexing-sdk/testing/overview',
    icon: 'CheckCircle',
  },
  {
    name: 'Observability',
    desc: 'Structured logs and per-stage timings, with optional CloudWatch and Google Cloud plugins.',
    href: '/libraries/indexing-sdk/observability',
    icon: 'Activity',
  },
  {
    name: 'Status & debugging',
    desc: 'Answer "why is my document not in search?" without guessing.',
    api: 'glean-idx document',
    href: '/libraries/indexing-sdk/status-and-debugging',
    icon: 'Search',
  },
  {
    name: 'Deployment',
    desc: 'Generate Docker and Terraform for a scheduled job on AWS or GCP.',
    api: 'glean-idx deploy',
    href: '/libraries/indexing-sdk/deployment/overview',
    icon: 'Cloud',
  },
];

const COMPARE: {
  feature: string;
  sdk: React.ReactNode;
  api: React.ReactNode;
}[] = [
  { feature: 'Language', sdk: 'Python', api: 'Any HTTP client' },
  { feature: 'Batching and upload sessions', sdk: true, api: false },
  { feature: 'Retries and rate limiting', sdk: true, api: false },
  { feature: 'Pagination against your source', sdk: true, api: false },
  { feature: 'Testing without a live instance', sdk: true, api: false },
  { feature: 'Structured logging and metrics', sdk: true, api: false },
  {
    feature: 'Deployment scaffolding',
    sdk: 'glean-idx deploy generates it',
    api: false,
  },
] as never;

function compareCell(value: React.ReactNode): React.ReactElement {
  if (value === true) {
    return (
      <span className={`${styles.compareCell} ${styles.compareYes}`}>
        {icon('Check', 15, 'var(--gdt-success)')}
        Built in
      </span>
    );
  }
  if (value === false) {
    return (
      <span className={styles.compareCell}>
        {icon('Minus', 15)}
        You implement it
      </span>
    );
  }
  return <span className={styles.compareCell}>{value}</span>;
}

/**
 * Indexing SDK overview, in the same shape as the Web SDK overview: a
 * designed single-component page that shows what the library does, then hands
 * off to conventional MDX docs for the details.
 */
export default function IndexingSdkOverview(): React.ReactElement {
  return (
    <div className={`${styles.page} indexing-sdk-root`}>
      <div className={styles.hero}>
        <div>
          <span className={styles.heroEyebrow}>
            <span className={styles.eyebrowDot} />
            Indexing SDK
          </span>
          <h1 className={styles.heroTitle}>
            Describe your source. Get a connector.
          </h1>
          <p className={styles.heroSub}>
            Install the Connector Builder plugin and tell your coding agent what
            you want indexed. It explores the source&apos;s API, plans the
            connector with you, generates it against this SDK, and tests it
            before anything reaches your index.
          </p>
          <div className={styles.heroCtas}>
            <button
              className={styles.heroPrimary}
              onClick={() => {
                const reduced =
                  typeof window.matchMedia === 'function' &&
                  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                document
                  .getElementById('install')
                  ?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
              }}
              type="button"
            >
              Install the plugin
              {icon('ArrowRight', 17)}
            </button>
            <Link
              className={styles.heroSecondary}
              to="/libraries/indexing-sdk/quickstart"
            >
              {icon('Code', 17)}
              Write it by hand
            </Link>
          </div>
        </div>
        <div>
          <TerminalPanel
            code={HERO_CODE}
            filename="terminal"
            label="Connector Builder"
            tinter={tintSession}
          />
        </div>
      </div>

      <section className={styles.section} id="install">
        <h2 className={styles.sectionTitle}>Install the Connector Builder</h2>
        <p className={styles.sectionSub}>
          Point your agent&apos;s plugin host at the SDK repository, which
          doubles as the marketplace.
        </p>
        <AgentInstall />

        <h3 className={styles.subHeading}>Then describe your source</h3>
        <div className={styles.prompts}>
          {PROMPTS.map((prompt) => (
            <p className={styles.prompt} key={prompt}>
              {prompt}
            </p>
          ))}
        </div>
        <p className={styles.tableNote}>
          The agent asks for whatever scope it still needs, confirms a plan with
          you, generates the connector, and runs the mocked and recorded test
          phases before offering to index anything. Hosts pull from the
          repository, so updating is a marketplace refresh rather than a rebuild
          &mdash;{' '}
          <code>claude plugin marketplace update glean-indexing-sdk</code>, then{' '}
          <code>
            claude plugin update glean-connector-builder@glean-indexing-sdk
          </code>
          .
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>What the agent does</h2>
        <p className={styles.sectionSub}>
          Eight skills coordinate the build. You confirm scope and review the
          result; the agent does the reading, wiring, and iterating.
        </p>
        <Stages stages={AGENT_STAGES} />

        <h3 className={styles.subHeading}>The eight skills</h3>
        <div className={styles.skillGrid}>
          {SKILLS.map((skill) => (
            <div className={styles.skillRow} key={skill.name}>
              <code className={styles.skillName}>{skill.name}</code>
              <span className={styles.skillCovers}>{skill.covers}</span>
            </div>
          ))}
        </div>
        <p className={styles.tableNote}>
          They encode the same guidance as these docs &mdash; notably crawl
          semantics, the rule most easily got wrong: a full crawl must cover the
          entire confirmed scope before completing, because stale-document
          deletion removes anything absent from the run. The sources live in{' '}
          <Link to="https://github.com/gleanwork/glean-indexing-sdk/tree/main/skills">
            <code>skills/</code>
          </Link>{' '}
          if you want to add one.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          Before you trust it, review these
        </h2>
        <p className={styles.sectionSub}>
          An agent produces a plausible connector quickly. These are the places
          a plausible connector is most often wrong — and the reason the rest of
          these docs exist.
        </p>
        <div className={styles.capGrid}>
          {REVIEW_ITEMS.map((item) => (
            <Link className={styles.capCard} key={item.href} to={item.href}>
              <span className={styles.capHead}>
                <span className={styles.capIcon}>{icon(item.icon, 16)}</span>
                <span className={styles.capTitle}>{item.name}</span>
              </span>
              <span className={styles.capBody}>{item.desc}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Two methods, five stages</h2>
        <p className={styles.sectionSub}>
          Whether an agent writes it or you do, a connector is the same
          pipeline. This is the shape of what gets generated.
        </p>
        <ConnectorPipeline />
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>What&apos;s in the box</h2>
        <p className={styles.sectionSub}>
          The agent wires these up as your source needs them. Each page is also
          the reference for doing it yourself.
        </p>
        <div className={styles.capGrid}>
          {CAPABILITIES.map((cap) => (
            <Link className={styles.capCard} key={cap.href} to={cap.href}>
              <span className={styles.capHead}>
                <span className={styles.capIcon}>{icon(cap.icon, 16)}</span>
                <span className={styles.capTitle}>{cap.name}</span>
              </span>
              <span className={styles.capBody}>{cap.desc}</span>
              {cap.api ? (
                <span className={styles.capApi}>{cap.api}</span>
              ) : null}
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Pick a base class</h2>
        <p className={styles.sectionSub}>
          The four connector types differ in how data flows through them, not in
          what they produce. Start with the first if you&apos;re unsure.
        </p>
        <ConnectorMatrix types={CONNECTOR_TYPES} />
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          Three test phases, one added dependency at a time
        </h2>
        <p className={styles.sectionSub}>
          Each phase swaps exactly one thing from mocked to real, so a failure
          tells you which layer broke.
        </p>
        <PhaseCards phases={TESTING_PHASES} />
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          SDK or the Indexing API directly?
        </h2>
        <p className={styles.sectionSub}>
          Both push into the same index. The difference is how much you build
          yourself.
        </p>
        <div className={styles.table}>
          <div className={`${styles.tableHead} ${styles.compareGrid}`}>
            <span />
            <span>Indexing SDK</span>
            <span>Indexing API directly</span>
          </div>
          {COMPARE.map((row) => (
            <div
              className={`${styles.tableRow} ${styles.compareGrid}`}
              key={row.feature}
            >
              <span className={styles.compareFeature}>{row.feature}</span>
              {compareCell(row.sdk)}
              {compareCell(row.api)}
            </div>
          ))}
        </div>
        <p className={styles.tableNote}>
          Use the <strong>SDK</strong> for a connector that runs on a schedule
          against a source system — most custom connectors. Use the{' '}
          <strong>API directly</strong> when indexing from a non-Python service,
          pushing occasional one-off documents, or attaching{' '}
          <Link to="/api-info/indexing/custom-metadata/overview">
            custom metadata
          </Link>{' '}
          to documents already in Glean. The SDK is a client for the Indexing
          API, not a replacement — the{' '}
          <Link to="/api-info/indexing/getting-started/overview">
            API documentation
          </Link>{' '}
          stays the reference for the wire protocol.
        </p>
      </section>
    </div>
  );
}
