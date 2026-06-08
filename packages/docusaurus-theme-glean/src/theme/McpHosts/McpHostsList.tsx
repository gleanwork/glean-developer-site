import React, { useMemo, useState } from 'react';
import clsx from 'clsx';
import Card from '../Card';
import CardGroup from '../CardGroup';
import {
  MCPConfigRegistry,
  CLIENT_TYPES,
  TYPE_LABELS,
  type ClientType,
} from '@gleanwork/mcp-config-schema/browser';
import McpHostIcon from './McpHostIcon';
import styles from './McpHostsList.module.css';

interface McpHost {
  id: string;
  displayName: string;
  types: readonly ClientType[];
  userConfigurable: boolean;
  documentationUrl?: string;
}

/**
 * Hosts not (yet) in @gleanwork/mcp-config-schema but supported in docs.
 * Merged into the registry-driven list so the grid stays complete.
 */
const EXTRA_HOSTS: McpHost[] = [
  {
    id: 'copilot-studio',
    displayName: 'Microsoft Copilot Studio',
    types: ['web'],
    userConfigurable: false,
    documentationUrl:
      'https://learn.microsoft.com/en-us/microsoft-copilot-studio/mcp-add-existing-server-to-agent',
  },
];

/** All supported hosts (registry + extras), sorted alphabetically by display name. */
function buildHosts(): McpHost[] {
  const registry = new MCPConfigRegistry();
  const fromRegistry: McpHost[] = registry.getAllConfigs().map((c) => ({
    id: c.id,
    displayName: c.displayName,
    types: c.types,
    userConfigurable: c.userConfigurable,
    documentationUrl: c.documentationUrl,
  }));
  return [...fromRegistry, ...EXTRA_HOSTS].sort((a, b) =>
    a.displayName.localeCompare(b.displayName, undefined, {
      sensitivity: 'base',
    }),
  );
}

const HOSTS = buildHosts();

type InstallFilter = 'all' | 'user' | 'admin';
type TypeFilter = 'all' | ClientType;

const INSTALL_OPTIONS: { value: InstallFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'user', label: 'User-installable' },
  { value: 'admin', label: 'Admin-managed' },
];

interface ChipGroupProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}

function ChipGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: ChipGroupProps<T>) {
  return (
    <div className={styles.facet}>
      <span className={styles.facetLabel}>{label}</span>
      <div className={styles.chips} role="group" aria-label={label}>
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={clsx(
              'button button--sm',
              value === opt.value ? 'button--primary' : 'button--secondary',
            )}
            aria-pressed={value === opt.value}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export interface McpHostsListProps {
  /** Pre-applies the installability filter (users can still change it). */
  defaultInstall?: InstallFilter;
  /** Cards per row. */
  cols?: number;
}

/**
 * Renders the full set of supported MCP hosts from @gleanwork/mcp-config-schema
 * (plus a small set of extras) with live filtering by installability, client
 * type, and name. Each card links to the host's official documentation.
 */
export default function McpHostsList({
  defaultInstall = 'all',
  cols = 3,
}: McpHostsListProps) {
  const [install, setInstall] = useState<InstallFilter>(defaultInstall);
  const [type, setType] = useState<TypeFilter>('all');
  const [query, setQuery] = useState('');

  const typeOptions: { value: TypeFilter; label: string }[] = useMemo(
    () => [
      { value: 'all', label: 'All' },
      ...CLIENT_TYPES.map((t) => ({ value: t, label: TYPE_LABELS[t] })),
    ],
    [],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return HOSTS.filter(
      (h) =>
        (install === 'all' || h.userConfigurable === (install === 'user')) &&
        (type === 'all' || h.types.includes(type)) &&
        (q === '' || h.displayName.toLowerCase().includes(q)),
    );
  }, [install, type, query]);

  const hasActiveFilters =
    install !== defaultInstall || type !== 'all' || query !== '';

  return (
    <div className={styles.root}>
      <div className={styles.filterBar}>
        <ChipGroup<InstallFilter>
          label="Install"
          value={install}
          options={INSTALL_OPTIONS}
          onChange={setInstall}
        />
        <ChipGroup<TypeFilter>
          label="Type"
          value={type}
          options={typeOptions}
          onChange={setType}
        />
        <div className={styles.search}>
          <span className={styles.facetLabel}>Search</span>
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Filter by name…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Filter hosts by name"
          />
        </div>
        <div className={styles.meta}>
          <span className={styles.count}>
            {visible.length} of {HOSTS.length}
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              className="button button--sm button--secondary"
              onClick={() => {
                setInstall(defaultInstall);
                setType('all');
                setQuery('');
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className={styles.empty}>No hosts match the current filters.</p>
      ) : (
        <CardGroup cols={cols}>
          {visible.map((host) => (
            <Card
              key={host.id}
              title={host.displayName}
              href={host.documentationUrl}
              color="var(--ifm-font-color-base)"
              icon={<McpHostIcon clientId={host.id} alt={host.displayName} />}
            >
              <span className={styles.cardPills}>
                {host.types.map((t) => (
                  <span key={t} className={styles.cardPill}>
                    {TYPE_LABELS[t]}
                  </span>
                ))}
              </span>
            </Card>
          ))}
        </CardGroup>
      )}
    </div>
  );
}
