import type React from 'react';
import type { ChangelogEntry } from '../../types/changelog';
import { CATEGORY_COLORS } from '../../types/changelog';
import styles from './ChangelogEntry.module.css';

interface ChangelogEntryProps {
  entry: ChangelogEntry;
  showDate?: boolean;
}

interface CategoryBadgeProps {
  category: string;
}

function formatDate(dateStr: string): { monthDay: string; year: string } {
  const date = new Date(dateStr);
  const monthDay = date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric'
  });
  const year = date.getFullYear().toString();
  return { monthDay, year };
}

function CategoryBadge({ category }: CategoryBadgeProps): React.ReactElement {
  const color = CATEGORY_COLORS[category] || 'secondary';
  return (
    <span className={`badge badge--${color}`}>
      {category}
    </span>
  );
}

export default function ChangelogEntry({ 
  entry,
  showDate = true 
}: ChangelogEntryProps): React.ReactElement {
  const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').trim();
  const summaryText = stripHtml(entry.summary);
  const fullText = stripHtml(entry.fullContent);
  const additionalText = fullText.replace(summaryText, '').trim();
  const hasSignificantAdditionalContent = additionalText.length > 50;
  
  const { monthDay, year } = formatDate(entry.date);
  
  return (
    <div className={styles.changelogEntry}>
      <div className={styles.entryDate}>
        {showDate ? (
          <time>
            <div className={styles.monthDay}>{monthDay}</div>
            <div className={styles.year}>{year}</div>
          </time>
        ) : null}
      </div>
      <div className={styles.contentWrapper}>
        {showDate && <div className={styles.entryDot}></div>}
        <div className={styles.entryContent}>
          <header className={styles.entryHeader}>
            <h2>{entry.title}</h2>
          </header>
          
          <div className={styles.entryBody}>
            <div dangerouslySetInnerHTML={{ __html: entry.summary }} />
          </div>
          
          {entry.hasTruncation && hasSignificantAdditionalContent && (
            <details className={styles.entryDetails}>
              <summary>
                <strong>Read more</strong>
              </summary>
              <div className={styles.fullContent}>
                <div dangerouslySetInnerHTML={{ 
                  __html: entry.fullContent.replace(entry.summary, '').trim() 
                }} />
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  );
} 