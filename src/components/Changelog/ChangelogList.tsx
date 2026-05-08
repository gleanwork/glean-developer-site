import type React from 'react';
import { useMemo, useState } from 'react';
import ChangelogEntries from './ChangelogEntries';
import {
  IMPACT_LABELS,
  type ChangelogEntry,
  type ChangelogImpact,
} from '../../types/changelog';
import styles from './ChangelogList.module.css';

interface ChangelogListProps {
  entries: Array<ChangelogEntry>;
  categories: Array<string>;
}

type ImpactFilter = 'all' | ChangelogImpact;

const IMPACT_FILTERS: Array<{ value: ImpactFilter; label: string }> = [
  { value: 'all', label: 'All attention levels' },
  { value: 'breaking', label: IMPACT_LABELS.breaking },
  { value: 'action_required', label: IMPACT_LABELS.action_required },
  { value: 'deprecated', label: IMPACT_LABELS.deprecated },
  { value: 'noteworthy', label: IMPACT_LABELS.noteworthy },
  { value: 'routine', label: IMPACT_LABELS.routine },
];

function matchesImpact(
  entry: ChangelogEntry,
  impactFilter: ImpactFilter,
): boolean {
  if (impactFilter === 'all') return true;
  if (impactFilter === 'routine') return entry.impact === 'routine';
  return (
    entry.impact === impactFilter ||
    (entry.attention ?? []).some(
      (attention) => attention.level === impactFilter,
    )
  );
}

export default function ChangelogList({
  entries,
  categories,
}: ChangelogListProps): React.ReactElement {
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [impactFilter, setImpactFilter] = useState<ImpactFilter>('all');

  const filteredEntries = useMemo(
    () =>
      entries.filter((entry) => {
        const matchesCategory =
          categoryFilter === 'all' ||
          entry.categories.includes(categoryFilter);
        return matchesCategory && matchesImpact(entry, impactFilter);
      }),
    [categoryFilter, entries, impactFilter],
  );

  const hasActiveFilters = categoryFilter !== 'all' || impactFilter !== 'all';

  return (
    <div className={styles.changelogList}>
      <div className={styles.filterBar}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel} htmlFor="changelog-category">
            Category
          </label>
          <select
            className={styles.filterSelect}
            id="changelog-category"
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
          >
            <option value="all">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel} htmlFor="changelog-impact">
            Attention
          </label>
          <select
            className={styles.filterSelect}
            id="changelog-impact"
            value={impactFilter}
            onChange={(event) =>
              setImpactFilter(event.target.value as ImpactFilter)
            }
          >
            {IMPACT_FILTERS.map((filter) => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterMeta}>
          <span>
            {filteredEntries.length} of {entries.length}
          </span>
          {hasActiveFilters ? (
            <button
              className={styles.clearButton}
              type="button"
              onClick={() => {
                setCategoryFilter('all');
                setImpactFilter('all');
              }}
            >
              Clear
            </button>
          ) : null}
        </div>
      </div>

      <ChangelogEntries entries={filteredEntries} />
    </div>
  );
}
