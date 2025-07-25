import type React from 'react';
import type { ChangelogEntry } from '../../types/changelog';
import ChangelogEntryComponent from './ChangelogEntry';
import styles from './ChangelogEntries.module.css';

interface ChangelogEntriesProps {
  entries: Array<ChangelogEntry>;
}

export default function ChangelogEntries({ 
  entries 
}: ChangelogEntriesProps): React.ReactElement {
  if (entries.length === 0) {
    return (
      <div className={styles.changelogEmpty}>
        <p>No changelog entries found for this category.</p>
      </div>
    );
  }

  return (
    <div className={styles.changelogEntries}>
      {entries.map((entry) => (
        <ChangelogEntryComponent key={entry.id} entry={entry} />
      ))}
    </div>
  );
} 