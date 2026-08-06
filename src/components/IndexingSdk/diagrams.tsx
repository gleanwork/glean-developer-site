import React from 'react';
import Link from '@docusaurus/Link';
import { getIcon } from '@gleanwork/docusaurus-theme-glean/Icons';
import styles from './styles.module.css';

export function icon(
  name: string,
  size = 18,
  color = 'currentColor',
): React.ReactNode {
  return getIcon(name, 'feather', { width: size, height: size, color });
}

/* -------------------------------------------------------------- pipeline */

type Owner = 'you' | 'sdk' | 'external';

export interface FlowNode {
  label: React.ReactNode;
  caption: string;
  icon: string;
  owner: Owner;
}

const OWNER_CLASS: Record<Owner, string> = {
  you: styles.nodeYou,
  sdk: styles.nodeSdk,
  external: '',
};

/**
 * Horizontal flow on a dotted canvas, colour-coded by who owns each stage.
 *
 * The legend isn't decoration: "which of these do I have to write?" is the
 * first question a connector author has, and the answer (two of five) is the
 * SDK's whole pitch. Showing it beats asserting it in prose.
 */
export function Pipeline({
  nodes,
  legend = true,
}: {
  nodes: FlowNode[];
  legend?: boolean;
}): React.ReactElement {
  const owners = new Set(nodes.map((n) => n.owner));
  return (
    <div className={styles.canvas}>
      <div className={styles.flow}>
        {nodes.map((node, i) => (
          <React.Fragment key={i}>
            {i > 0 ? (
              <span className={styles.flowArrow}>{icon('ArrowRight', 20)}</span>
            ) : null}
            <div className={`${styles.node} ${OWNER_CLASS[node.owner]}`}>
              <span className={styles.nodeIcon}>{icon(node.icon, 18)}</span>
              <span className={styles.nodeLabel}>{node.label}</span>
              <span className={styles.nodeCaption}>{node.caption}</span>
            </div>
          </React.Fragment>
        ))}
      </div>
      {legend ? (
        <div className={styles.legend}>
          {owners.has('you') ? (
            <span className={styles.legendItem}>
              <span className={`${styles.legendSwatch} ${styles.swatchYou}`} />
              You write this
            </span>
          ) : null}
          {owners.has('sdk') ? (
            <span className={styles.legendItem}>
              <span className={`${styles.legendSwatch} ${styles.swatchSdk}`} />
              The SDK handles this
            </span>
          ) : null}
          {owners.has('external') ? (
            <span className={styles.legendItem}>
              <span
                className={`${styles.legendSwatch} ${styles.swatchExternal}`}
              />
              External system
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** The canonical connector pipeline, reused on several pages. */
export const CONNECTOR_PIPELINE: FlowNode[] = [
  {
    label: 'Source system',
    caption: 'Your wiki, catalog, database',
    icon: 'Server',
    owner: 'external',
  },
  {
    label: <code>get_source_data()</code>,
    caption: 'Fetch raw records',
    icon: 'Download',
    owner: 'you',
  },
  {
    label: <code>transform()</code>,
    caption: 'Map to Glean documents',
    icon: 'Code',
    owner: 'you',
  },
  {
    label: <code>PushUploader</code>,
    caption: 'Batch, retry, upload',
    icon: 'Upload',
    owner: 'sdk',
  },
  {
    label: 'Glean index',
    caption: 'Searchable, permission-aware',
    icon: 'Search',
    owner: 'sdk',
  },
];

export function ConnectorPipeline(): React.ReactElement {
  return <Pipeline nodes={CONNECTOR_PIPELINE} />;
}

/* ------------------------------------------------------ lifecycle stages */

export interface Stage {
  title: React.ReactNode;
  body: React.ReactNode;
  owner?: Owner;
}

/** Numbered vertical timeline, matching the cookbook / plugin step rail. */
export function Stages({ stages }: { stages: Stage[] }): React.ReactElement {
  return (
    <div className={styles.stages}>
      <div className={styles.stagesRail} />
      {stages.map((stage, i) => (
        <div className={styles.stage} key={i}>
          <span
            className={`${styles.stageNum} ${
              stage.owner === 'sdk' ? styles.stageNumSdk : ''
            }`}
          >
            {i + 1}
          </span>
          <div className={styles.stageTitle}>
            {stage.title}
            {stage.owner ? (
              <span
                className={`${styles.stageOwner} ${
                  stage.owner === 'you' ? styles.ownerYou : styles.ownerSdk
                }`}
              >
                {stage.owner === 'you' ? 'Your code' : 'SDK'}
              </span>
            ) : null}
          </div>
          <p className={styles.stageBody}>{stage.body}</p>
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------- phase cards */

export interface Phase {
  n: number;
  name: string;
  href: string;
  source: 'real' | 'mocked';
  glean: 'real' | 'mocked';
  speed: string;
  credentials: string;
  body: string;
  /** The question this phase actually answers. */
  answers: string;
}

function reality(value: 'real' | 'mocked'): React.ReactElement {
  return (
    <span className={styles.phaseRowVal}>
      <span
        className={`${styles.dot} ${
          value === 'real' ? styles.dotReal : styles.dotMock
        }`}
      />
      {value === 'real' ? 'Real' : 'Mocked'}
    </span>
  );
}

/**
 * Three testing phases side by side. Green/grey dots on the Source and Glean
 * rows make the progression legible at a glance — each phase swaps exactly
 * one dependency from mocked to real.
 */
export function PhaseCards({
  phases,
}: {
  phases: Phase[];
}): React.ReactElement {
  return (
    <div className={styles.phaseGrid}>
      {phases.map((phase) => (
        <Link className={styles.phaseCard} key={phase.href} to={phase.href}>
          <div className={styles.phaseHead}>
            <span className={styles.phaseNum}>{phase.n}</span>
            <span className={styles.phaseName}>{phase.name}</span>
            <span className={styles.phaseArrow}>{icon('ArrowRight', 15)}</span>
          </div>
          <div className={styles.phaseRows}>
            <div className={styles.phaseRow}>
              <span className={styles.phaseRowKey}>Source</span>
              {reality(phase.source)}
            </div>
            <div className={styles.phaseRow}>
              <span className={styles.phaseRowKey}>Glean</span>
              {reality(phase.glean)}
            </div>
            <div className={styles.phaseRow}>
              <span className={styles.phaseRowKey}>Speed</span>
              <span className={styles.phaseRowVal}>{phase.speed}</span>
            </div>
            <div className={styles.phaseRow}>
              <span className={styles.phaseRowKey}>Credentials</span>
              <span className={styles.phaseRowVal}>{phase.credentials}</span>
            </div>
          </div>
          <p className={styles.phaseBody}>{phase.body}</p>
          <div className={styles.phaseAsk}>{phase.answers}</div>
        </Link>
      ))}
    </div>
  );
}

export const TESTING_PHASES: Phase[] = [
  {
    n: 1,
    name: 'Unit',
    href: '/libraries/indexing-sdk/testing/unit',
    source: 'mocked',
    glean: 'mocked',
    speed: 'Milliseconds',
    credentials: 'None',
    body: 'run_connector with a static data client. No network at all.',
    answers: 'Does transform() produce the documents I expect?',
  },
  {
    n: 2,
    name: 'Integration',
    href: '/libraries/indexing-sdk/testing/integration',
    source: 'real',
    glean: 'mocked',
    speed: 'Fast after first run',
    credentials: 'Source only',
    body: 'Records real source responses to NDJSON, then replays them offline.',
    answers: 'Does my data client parse what the source really returns?',
  },
  {
    n: 3,
    name: 'End-to-end',
    href: '/libraries/indexing-sdk/testing/end-to-end',
    source: 'real',
    glean: 'real',
    speed: 'Slow',
    credentials: 'Source + Glean',
    body: 'No mocking. Uploads to whatever GLEAN_SERVER_URL points at.',
    answers: 'Does the whole thing work against a live instance?',
  },
];

/* ------------------------------------------------------ connector matrix */

export interface ConnectorType {
  name: string;
  icon: string;
  when: string;
  dataClient: string;
  produces: string;
  memory: string;
}

/** The four connector base classes as comparable cards. */
export function ConnectorMatrix({
  types,
}: {
  types: ConnectorType[];
}): React.ReactElement {
  return (
    <div className={styles.matrix}>
      {types.map((type) => (
        <div className={styles.matrixCard} key={type.name}>
          <div className={styles.matrixHead}>
            <span className={styles.matrixIcon}>{icon(type.icon, 17)}</span>
            <span className={styles.matrixName}>{type.name}</span>
          </div>
          <p className={styles.matrixWhen}>{type.when}</p>
          <div className={styles.matrixMeta}>
            <div className={styles.matrixMetaRow}>
              <span className={styles.matrixMetaKey}>Data client</span>
              <span className={styles.matrixMetaVal}>
                <code>{type.dataClient}</code>
              </span>
            </div>
            <div className={styles.matrixMetaRow}>
              <span className={styles.matrixMetaKey}>Produces</span>
              <span className={styles.matrixMetaVal}>
                <code>{type.produces}</code>
              </span>
            </div>
            <div className={styles.matrixMetaRow}>
              <span className={styles.matrixMetaKey}>Peak memory</span>
              <span className={styles.matrixMetaVal}>{type.memory}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export const CONNECTOR_TYPES: ConnectorType[] = [
  {
    name: 'BaseDatasourceConnector',
    icon: 'Box',
    when: 'The whole dataset fits comfortably in memory. Wikis, service catalogs, config databases.',
    dataClient: 'BaseDataClient',
    produces: 'DocumentDefinition',
    memory: 'Whole dataset',
  },
  {
    name: 'BaseStreamingDatasourceConnector',
    icon: 'Layers',
    when: 'The dataset is large or paginated and your source client is synchronous.',
    dataClient: 'BaseStreamingDataClient',
    produces: 'DocumentDefinition',
    memory: 'One batch',
  },
  {
    name: 'BaseAsyncStreamingDatasourceConnector',
    icon: 'Zap',
    when: 'Same as streaming, but your source client is async — httpx.AsyncClient, aiohttp.',
    dataClient: 'BaseAsyncStreamingDataClient',
    produces: 'DocumentDefinition',
    memory: 'One batch',
  },
  {
    name: 'BasePeopleConnector',
    icon: 'Users',
    when: "You're indexing employee and identity records rather than documents.",
    dataClient: 'BaseDataClient',
    produces: 'EmployeeInfoDefinition',
    memory: 'Whole dataset',
  },
];
