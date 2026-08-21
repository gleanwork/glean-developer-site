import React, { useMemo, useState } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Card from '../Card';
import CardGroup from '../CardGroup';
import {
  MCPConfigRegistry,
  CLIENT_TYPES,
  TYPE_LABELS,
  type ClientId,
  type ClientType,
  type SupportedAuth,
  type Transport,
} from '@gleanwork/mcp-config-schema/browser';
import McpHostIcon from './McpHostIcon';
import styles from './McpHostsList.module.css';

interface McpHost {
  id: string;
  displayName: string;
  types: readonly ClientType[];
  userConfigurable: boolean;
  documentationUrl?: string;
  gleanDocumentationUrl?: string;
  managedSetupUrl?: string;
  transports: readonly Transport[];
  supportedAuth: readonly SupportedAuth[];
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
    gleanDocumentationUrl:
      'https://docs.glean.com/administration/platform/mcp/host-guides/copilot-studio',
    transports: ['http'],
    supportedAuth: ['token', 'oauth:dcr'],
  },
];

const ORGANIZATION_GUIDANCE_URL =
  'https://docs.glean.com/administration/platform/mcp/about';
const GLEAN_MCP_GUIDANCE_URL = 'https://docs.glean.com/guides/mcp/mcp';

// Prefer Glean's host guides when they cover the connection. The registry's
// documentationUrl remains available as the vendor documentation link.
const GLEAN_DOCUMENTATION_URLS = {
  chatgpt:
    'https://docs.glean.com/administration/platform/mcp/host-guides/chatgpt',
  'claude-desktop':
    'https://docs.glean.com/administration/platform/mcp/host-guides/claude-desktop',
  'copilot-studio':
    'https://docs.glean.com/administration/platform/mcp/host-guides/copilot-studio',
  'gemini-enterprise':
    'https://docs.glean.com/administration/platform/embedded-integrations/glean-in-gemini-chat/',
  librechat:
    'https://docs.glean.com/administration/platform/mcp/host-guides/librechat',
} as const;

// Matches GLEAN_REGISTRY_OPTIONS.managedSetupUrls in @gleanwork/mcp-config-glean.
const GLEAN_MANAGED_SETUP_URLS = {
  chatgpt: 'https://chatgpt.com/admin/apps?tab=available&q=glean',
  'claude-teams-enterprise': 'https://claude.ai/directory/connectors/glean',
  'cursor-team': 'https://cursor.com/dashboard/integrations',
} as const satisfies Partial<Record<ClientId, string>>;

/** All supported hosts (registry + missing fallbacks), sorted alphabetically. */
function buildHosts(): McpHost[] {
  const registry = new MCPConfigRegistry({
    managedSetupUrls: GLEAN_MANAGED_SETUP_URLS,
  });
  const fromRegistry: McpHost[] = registry.getAllConfigs().map((c) => ({
    id: c.id,
    displayName: c.displayName,
    types: c.types,
    userConfigurable: c.userConfigurable,
    documentationUrl: c.documentationUrl,
    gleanDocumentationUrl:
      GLEAN_DOCUMENTATION_URLS[c.id] ?? GLEAN_MCP_GUIDANCE_URL,
    managedSetupUrl: registry.getManagedSetupUrl(c.id),
    transports: c.transports,
    supportedAuth: c.supportedAuth,
  }));

  const byId = new Map(EXTRA_HOSTS.map((host) => [host.id, host]));
  fromRegistry.forEach((host) => byId.set(host.id, host));

  return [...byId.values()].sort((a, b) =>
    a.displayName.localeCompare(b.displayName, undefined, {
      sensitivity: 'base',
    }),
  );
}

const HOSTS = buildHosts();

const TRANSPORT_LABELS: Record<Transport, string> = {
  stdio: 'STDIO',
  http: 'HTTP',
};

const AUTH_LABELS: Record<SupportedAuth, string> = {
  token: 'API token',
  'oauth:dcr': 'OAuth via DCR',
};

type InstallFilter = 'all' | 'user' | 'admin';
type TypeFilter = 'all' | ClientType;

const INSTALL_OPTIONS: { value: InstallFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'user', label: 'User-configurable' },
  { value: 'admin', label: 'Organization-managed' },
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
 * type, and name. Each card shows setup actions appropriate to its ownership.
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
          label="Configuration"
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
              color="var(--ifm-font-color-base)"
              icon={
                host.gleanDocumentationUrl ? (
                  <Link
                    className={styles.iconLink}
                    to={host.gleanDocumentationUrl}
                    aria-label={`Open ${host.displayName} Glean documentation`}
                  >
                    <McpHostIcon clientId={host.id} alt={host.displayName} />
                  </Link>
                ) : (
                  <McpHostIcon clientId={host.id} alt={host.displayName} />
                )
              }
            >
              <span className={styles.cardPills}>
                {host.types.map((t) => (
                  <span key={t} className={styles.cardPill}>
                    {TYPE_LABELS[t]}
                  </span>
                ))}
              </span>
              <dl className={styles.cardMetadata}>
                <div>
                  <dt>Configuration</dt>
                  <dd>
                    {host.userConfigurable
                      ? 'User-configurable'
                      : 'Organization-managed'}
                  </dd>
                </div>
                <div>
                  <dt>Transport</dt>
                  <dd>
                    {host.transports
                      .map((value) => TRANSPORT_LABELS[value])
                      .join(', ')}
                  </dd>
                </div>
                <div>
                  <dt>Authentication</dt>
                  <dd>
                    {host.supportedAuth.length > 0
                      ? host.supportedAuth
                          .map((value) => AUTH_LABELS[value])
                          .join(', ')
                      : 'Not specified. See host documentation.'}
                  </dd>
                </div>
              </dl>
              <div className={styles.cardActions}>
                {host.userConfigurable ? (
                  <Link
                    className="button button--sm button--primary"
                    to={`https://app.glean.com/settings/install?mcpConfigure=true&mcpHost=${host.id}`}
                    aria-label={`Open MCP Configurator for ${host.displayName}`}
                  >
                    Open MCP Configurator
                  </Link>
                ) : host.managedSetupUrl ? (
                  <Link
                    className="button button--sm button--primary"
                    to={host.managedSetupUrl}
                    aria-label={`Set up Glean for ${host.displayName}`}
                  >
                    Set up Glean
                  </Link>
                ) : (
                  <Link
                    className="button button--sm button--primary"
                    to={ORGANIZATION_GUIDANCE_URL}
                    aria-label={`Organization setup guidance for ${host.displayName}`}
                  >
                    Organization setup guidance
                  </Link>
                )}
                {host.gleanDocumentationUrl && (
                  <Link
                    className="button button--sm button--secondary"
                    to={host.gleanDocumentationUrl}
                    aria-label={`Read ${host.displayName} Glean documentation`}
                  >
                    Glean documentation
                  </Link>
                )}
                {host.documentationUrl ? (
                  <Link
                    className="button button--sm button--secondary"
                    to={host.documentationUrl}
                    aria-label={`Read ${host.displayName} vendor documentation`}
                  >
                    Vendor documentation
                  </Link>
                ) : (
                  <span className={styles.missingDocumentation}>
                    Vendor documentation unavailable
                  </span>
                )}
              </div>
            </Card>
          ))}
        </CardGroup>
      )}
    </div>
  );
}
