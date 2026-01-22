import type { ReactElement } from 'react';
import type { DeprecationItem } from '../../types/deprecations';
import styles from './DeprecationEntry.module.css';

interface DeprecationEntryProps {
  entry: DeprecationItem;
  showRemovalDate?: boolean;
}

function isUrl(text: string | undefined): boolean {
  if (!text) return false;
  return /^https?:\/\/[^\s]+$/.test(text.trim());
}

export default function DeprecationEntry({
  entry,
  showRemovalDate = false,
}: DeprecationEntryProps): ReactElement {
  const docsIsUrl = isUrl(entry.docs);

  // Check if the deprecation has already been removed
  const [year, month, day] = entry.removal.split('-').map(Number);
  const removalDate = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isPast = removalDate < today;

  // Build display name: for enum-value deprecations, show "fieldName: enumValue"
  const displayName =
    entry.type === 'enum-value' && entry.enumValue
      ? `${entry.name}: ${entry.enumValue}`
      : entry.name;

  return (
    <div className={styles.deprecationEntry}>
      <div className={styles.entryHeader}>
        <div className={styles.entryTitle}>
          <code className={styles.entryName}>{displayName}</code>
        </div>
      </div>

      <div className={styles.entryBody}>
        <p className={styles.entryMessage}>{entry.message}</p>
        {entry.docs && !docsIsUrl && (
          <div className={styles.migrationNote}>
            <span className={styles.migrationLabel}>Note:</span>
            <span>{entry.docs}</span>
          </div>
        )}
      </div>

      <div className={styles.entryFooter}>
        <div className={styles.entryDates}>
          <span className={styles.dateLabel}>
            Deprecation introduced on <time>{entry.introduced}</time>
          </span>
          {(showRemovalDate || isPast) && (
            <>
              <span className={styles.dateSeparator}>|</span>
              <span className={styles.dateLabel}>
                {isPast ? 'Removed on' : 'Will be removed after'}{' '}
                <time className={styles.removalDate}>{entry.removal}</time>
              </span>
            </>
          )}
        </div>
        {docsIsUrl && (
          <a
            href={entry.docs}
            className={styles.docsLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            More details
          </a>
        )}
      </div>
    </div>
  );
}
