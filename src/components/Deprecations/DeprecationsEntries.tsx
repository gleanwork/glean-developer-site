import React, { useState, useMemo, useEffect } from 'react';
import { useHistory, useLocation } from '@docusaurus/router';
import type {
  EndpointGroup as EndpointGroupType,
  DeprecationItem,
} from '../../types/deprecations';
import EndpointGroup from './EndpointGroup';
import styles from './DeprecationsEntries.module.css';

/** Fixed removal dates throughout the year */
const REMOVAL_DATES = [
  { month: 0, day: 15 }, // Jan 15
  { month: 3, day: 15 }, // Apr 15
  { month: 6, day: 15 }, // Jul 15
  { month: 9, day: 15 }, // Oct 15
];

/** Get the next 4 removal dates starting from today */
function getNextRemovalDates(): Date[] {
  const now = new Date();
  const dates: Date[] = [];
  let year = now.getFullYear();

  // Generate removal dates for this year and next
  const allDates: Date[] = [];
  for (let y = year; y <= year + 2; y++) {
    for (const { month, day } of REMOVAL_DATES) {
      allDates.push(new Date(y, month, day));
    }
  }

  // Filter to only future dates and take next 4
  for (const date of allDates) {
    if (date > now && dates.length < 4) {
      dates.push(date);
    }
  }

  return dates;
}

/** Format a date as ISO-8601 (YYYY-MM-DD) */
function formatDateAsIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

type RemovalFilter = 'all' | 'past' | string; // string for specific dates like "2026-01-15"

function isValidFilter(value: string | null, validDates: string[]): boolean {
  if (value === null) return false;
  if (value === 'all' || value === 'past') return true;
  return validDates.includes(value);
}

interface DateSection {
  date: Date;
  dateKey: string;
  displayDate: string;
  endpoints: EndpointGroupType[];
}

interface DeprecationsEntriesProps {
  endpoints: EndpointGroupType[];
}

/** Parse a date string like "2026-01-15" into components */
function parseDateString(dateStr: string): {
  year: number;
  month: number;
  day: number;
} {
  const [year, month, day] = dateStr.split('-').map(Number);
  return { year, month: month - 1, day }; // month is 0-indexed
}

/** Group deprecations by removal date, then by endpoint */
function groupDeprecationsByDate(
  endpoints: EndpointGroupType[],
  removalDates: Date[],
  filter: RemovalFilter,
): DateSection[] {
  const now = new Date();
  const sections: DateSection[] = [];

  // Handle past deprecations filter
  if (filter === 'past') {
    const pastEndpoints = endpoints
      .map((group) => ({
        ...group,
        deprecations: group.deprecations.filter((dep) => {
          const depDate = parseDateString(dep.removal);
          const removalDate = new Date(depDate.year, depDate.month, depDate.day);
          return removalDate <= now;
        }),
      }))
      .filter((group) => group.deprecations.length > 0);

    if (pastEndpoints.length > 0) {
      sections.push({
        date: now,
        dateKey: 'past',
        displayDate: 'Past Deprecations',
        endpoints: pastEndpoints,
      });
    }
    return sections;
  }

  // For specific date filter or "all"
  const datesToShow =
    filter === 'all'
      ? removalDates
      : removalDates.filter((d) => formatDateAsIso(d) === filter);

  for (const removalDate of datesToShow) {
    const dateKey = formatDateAsIso(removalDate);

    // Get endpoints with deprecations matching this removal date
    const matchingEndpoints = endpoints
      .map((group) => ({
        ...group,
        deprecations: group.deprecations.filter((dep) => {
          // Compare using the date string directly to avoid timezone issues
          const depDate = parseDateString(dep.removal);
          return (
            depDate.year === removalDate.getFullYear() &&
            depDate.month === removalDate.getMonth() &&
            depDate.day === removalDate.getDate()
          );
        }),
      }))
      .filter((group) => group.deprecations.length > 0);

    if (matchingEndpoints.length > 0) {
      sections.push({
        date: removalDate,
        dateKey,
        displayDate: formatDateAsIso(removalDate),
        endpoints: matchingEndpoints,
      });
    }
  }

  return sections;
}

export default function DeprecationsEntries({
  endpoints,
}: DeprecationsEntriesProps): React.ReactElement {
  const history = useHistory();
  const location = useLocation();

  // Calculate the next 4 removal dates
  const removalDates = useMemo(() => getNextRemovalDates(), []);
  const validDateKeys = useMemo(
    () => removalDates.map(formatDateAsIso),
    [removalDates],
  );

  const getFilterFromUrl = (): RemovalFilter => {
    const params = new URLSearchParams(location.search);
    const filterParam = params.get('filter');
    return isValidFilter(filterParam, validDateKeys) ? filterParam : 'all';
  };

  const [removalFilter, setRemovalFilter] =
    useState<RemovalFilter>(getFilterFromUrl);

  useEffect(() => {
    const filterFromUrl = getFilterFromUrl();
    if (filterFromUrl !== removalFilter) {
      setRemovalFilter(filterFromUrl);
    }
  }, [location.search, validDateKeys]);

  const handleFilterChange = (newFilter: RemovalFilter) => {
    setRemovalFilter(newFilter);
    const params = new URLSearchParams(location.search);
    if (newFilter === 'all') {
      params.delete('filter');
    } else {
      params.set('filter', newFilter);
    }
    const newSearch = params.toString();
    history.push({
      pathname: location.pathname,
      search: newSearch ? `?${newSearch}` : '',
    });
  };

  const dateSections = useMemo(() => {
    return groupDeprecationsByDate(endpoints, removalDates, removalFilter);
  }, [endpoints, removalDates, removalFilter]);

  return (
    <div className={styles.deprecationsEntries}>
      <div className={styles.filterControls}>
        <div className={styles.filterGroup}>
          <label htmlFor="removal-filter" className={styles.filterLabel}>
            Filter deprecations:
          </label>
          <select
            id="removal-filter"
            value={removalFilter}
            onChange={(e) =>
              handleFilterChange(e.target.value as RemovalFilter)
            }
            className={styles.filterSelect}
          >
            <option value="all">All upcoming</option>
            {removalDates.map((date) => (
              <option key={formatDateAsIso(date)} value={formatDateAsIso(date)}>
                Removal date: {formatDateAsIso(date)}
              </option>
            ))}
            <option value="past">All past deprecations</option>
          </select>
        </div>
      </div>

      {dateSections.length === 0 ? (
        <div className={styles.deprecationsEmpty}>
          <p>No deprecations found matching the selected filter.</p>
        </div>
      ) : (
        dateSections.map((section) => (
          <div key={section.dateKey} className={styles.dateSection}>
            <h2 className={styles.dateSectionHeader}>
              {section.dateKey === 'past'
                ? section.displayDate
                : `Removal date: ${section.displayDate}`}
            </h2>
            {section.endpoints.map((group) => (
              <EndpointGroup
                key={`${section.dateKey}-${group.method}-${group.path}`}
                group={group}
                showRemovalDate={section.dateKey === 'past'}
              />
            ))}
          </div>
        ))
      )}
    </div>
  );
}
