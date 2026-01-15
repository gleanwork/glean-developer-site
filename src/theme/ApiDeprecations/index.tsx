import type React from 'react';
import Link from '@docusaurus/Link';
import type { DeprecationItem } from '../../types/deprecations';
import DeprecationEntry from '../../components/Deprecations/DeprecationEntry';
import styles from './styles.module.css';

interface ApiDeprecationsProps {
  deprecations: DeprecationItem[];
}

export default function ApiDeprecations({
  deprecations,
}: ApiDeprecationsProps): React.ReactElement | null {
  if (!deprecations || deprecations.length === 0) {
    return null;
  }

  const deprecationCount = deprecations.length;
  const summaryText =
    deprecationCount === 1
      ? '1 active deprecation'
      : `${deprecationCount} active deprecations`;

  return (
    <details className={styles.deprecationsContainer}>
      <summary className={styles.deprecationsSummary}>
        <span className={styles.warningIcon}>&#9888;</span>
        <span className={styles.summaryText}>{summaryText}</span>
      </summary>
      <div className={styles.deprecationsList}>
        {deprecations.map((deprecation) => (
          <DeprecationEntry
            key={deprecation.id}
            entry={deprecation}
            showRemovalDate
          />
        ))}
        <div className={styles.viewAllContainer}>
          <Link to="/deprecations" className={styles.viewAllLink}>
            View All Deprecations
          </Link>
        </div>
      </div>
    </details>
  );
}
