import React, { Fragment, type ReactNode } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import { Icon } from '@theme/Icons';
import BeakerIcon from '@site/src/components/BeakerIcon';
import DeprecationEntry from '@site/src/components/Deprecations/DeprecationEntry';
import type { DeprecationItem } from '@site/src/types/deprecations';
import type {
  EndpointAuthorization,
  EndpointRelease,
  ReleaseStage,
} from '@site/src/types/endpointMetadata';
import styles from './styles.module.css';

const STAGE_LABELS: Record<ReleaseStage, string> = {
  experimental: 'Experimental',
  beta: 'Beta',
  ga: 'Generally available',
  deprecated: 'Deprecated',
};

const STAGE_CLASS: Record<ReleaseStage, string> = {
  experimental: styles.stageExperimental,
  beta: styles.stageBeta,
  ga: styles.stageGa,
  deprecated: styles.stageDeprecated,
};

function stageClass(stage: ReleaseStage): string {
  return STAGE_CLASS[stage];
}

/** "2026-06-23" → "June 23, 2026", parsed in UTC so the day doesn't drift. */
function formatDate(iso?: string): string | undefined {
  if (!iso) return undefined;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

function StageIcon({ stage }: { stage: ReleaseStage }): ReactNode {
  switch (stage) {
    case 'experimental':
      return <BeakerIcon className={styles.icon} />;
    case 'beta':
      return <Icon name="Zap" className={styles.icon} />;
    case 'deprecated':
      return <Icon name="AlertTriangle" className={styles.icon} />;
    default:
      return <Icon name="CheckCircle" className={styles.icon} />;
  }
}

export function StageBadge({ stage }: { stage: ReleaseStage }): ReactNode {
  return (
    <span className={clsx(styles.stageBadge, stageClass(stage))}>
      <StageIcon stage={stage} />
      {STAGE_LABELS[stage]}
    </span>
  );
}

/** Dot-separated items beside the badge for each stage. */
function stageDetailItems(release: EndpointRelease): ReactNode[] {
  const since = formatDate(release.since);
  switch (release.stage) {
    case 'experimental':
      return [
        since && `Introduced ${since}`,
        <Link to="/experimental/overview">How experimental APIs work</Link>,
      ];
    case 'deprecated': {
      const removal = formatDate(release.removal);
      return [
        since && `Since ${since}`,
        removal && `Removal on ${removal}`,
        release.docs ? (
          <Link to={release.docs}>Migration guide</Link>
        ) : (
          <Link to="/deprecations">All deprecations</Link>
        ),
      ];
    }
    default:
      return [since && `Introduced ${since}`];
  }
}

/**
 * Muted one-liner beside the badge, in the same style as the Authorization
 * row, e.g. "Introduced June 23, 2026 · How experimental APIs work" or
 * "Since August 25, 2026 · Removal on April 15, 2027 · Migration guide".
 */
export function StageDetails({
  release,
}: {
  release: EndpointRelease;
}): ReactNode {
  const items = stageDetailItems(release).filter(Boolean);
  if (items.length === 0) return null;
  return (
    <span className={styles.muted}>
      {items.map((item, i) => (
        <Fragment key={i}>
          {i > 0 && ' · '}
          {item}
        </Fragment>
      ))}
    </span>
  );
}

/** Callout under the badge for Beta. `null` for other stages. */
export function StageNotice({
  release,
}: {
  release: EndpointRelease;
}): ReactNode {
  if (release.stage !== 'beta') return null;
  return (
    <p className={clsx(styles.note, stageClass(release.stage))}>
      This endpoint is in Beta. Expect changes and instability.
    </p>
  );
}

export function ScopeList({ scopes }: { scopes: string[] }): ReactNode {
  return (
    <span className={styles.inlineRow}>
      {scopes.map((s) => (
        <code key={s} className={styles.scope}>
          {s}
        </code>
      ))}
    </span>
  );
}

export function AuthSummary({
  auth,
}: {
  auth: EndpointAuthorization;
}): ReactNode {
  return (
    <span className={styles.auth}>
      <code className={styles.authHeader}>{auth.header}</code>
      <span className={styles.muted}>
        {auth.tokenTypes.join(' or ')} ·{' '}
        <Link to={auth.docsUrl}>Authentication</Link>
      </span>
    </span>
  );
}

/** Field, parameter, and enum deprecations on an endpoint that stays live. */
export function FieldDeprecations({
  items,
}: {
  items: DeprecationItem[];
}): ReactNode {
  const earliest = items.map((d) => d.removal).sort()[0];
  return (
    <details className={styles.fieldDeprecations}>
      <summary>
        <Icon name="AlertTriangle" className={styles.icon} />
        {items.length === 1
          ? '1 deprecated field'
          : `${items.length} deprecated fields`}
        <span className={styles.muted}>
          {' '}
          · earliest removal {formatDate(earliest)}
        </span>
        <span className={styles.chevron} aria-hidden="true">
          <Icon name="ChevronDown" className={styles.chevronIcon} />
        </span>
      </summary>
      <div className={styles.fieldDeprecationsList}>
        {items.map((d) => (
          <DeprecationEntry key={d.id} entry={d} showRemovalDate />
        ))}
      </div>
    </details>
  );
}
