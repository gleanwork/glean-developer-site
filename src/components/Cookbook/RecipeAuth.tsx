import type React from 'react';
import Link from '@docusaurus/Link';
import type { RecipeRecord } from '../../types/recipe';
import { authContexts, type AuthKind } from './authContexts';
import styles from './RecipeLayout.module.css';

const FIND_SERVER = '/get-started/authentication#finding-your-server-url';
const CLIENT_TOKEN = '/api-info/client/authentication/glean-issued';
const INDEXING_TOKEN = '/api-info/indexing/authentication/overview';
const OAUTH = '/api-info/client/authentication/oauth';
const TOKEN_MGMT_CLIENT =
  'https://app.glean.com/admin/platform/tokenManagement?tab=client';
const TOKEN_MGMT_INDEXING =
  'https://app.glean.com/admin/platform/tokenManagement?tab=indexing';

function AuthBlock({
  kind,
  scopeList,
  login,
}: {
  kind: AuthKind;
  scopeList: string[];
  login?: string;
}): React.ReactElement | null {
  const scopes = scopeList.join(', ');

  switch (kind) {
    case 'none':
      return null;
    case 'browser-cookie':
      return (
        <p>
          This path uses your existing Glean browser session. Find the web app
          URL on the About page. The API{' '}
          <Link to={FIND_SERVER}>server URL</Link> is a different field.
        </p>
      );
    case 'oauth-with-token-fallback':
      return (
        <p>
          Run the authenticate step on this page. It discovers your tenant from
          work email and signs you in with <Link to={OAUTH}>OAuth</Link>
          {login ? ', using the shipped login command' : ''}. If OAuth is
          unavailable, create a scoped{' '}
          <Link to={CLIENT_TOKEN}>Glean-issued token</Link> in{' '}
          <Link to={TOKEN_MGMT_CLIENT}>Token Management</Link>
          {scopes ? ` (${scopes})` : ''}.
        </p>
      );
    case 'indexing-token':
      return (
        <p>
          Indexing calls need a Glean-issued token, not OAuth. Create one in{' '}
          <Link to={TOKEN_MGMT_INDEXING}>Indexing Token Management</Link>. See{' '}
          <Link to={INDEXING_TOKEN}>Indexing API authentication</Link>.
        </p>
      );
    case 'hosted-secret':
      return (
        <p>
          Create a Client API token
          {scopes ? ` with ${scopes}` : ''} in{' '}
          <Link to={TOKEN_MGMT_CLIENT}>Token Management</Link>. Keep it in the
          host&apos;s secret store, never in a prompt. Steps:{' '}
          <Link to={CLIENT_TOKEN}>Glean-issued tokens</Link>.
        </p>
      );
    case 'host-managed':
      return (
        <p>
          The host signs in with Glean OAuth. Do not mint an API token for this
          recipe. Resolve the <Link to={FIND_SERVER}>server URL</Link> first if
          a setup command asks for it.
        </p>
      );
    case 'external-api-key':
      return (
        <p>
          This recipe uses a third-party API key in addition to Glean. Follow
          the authenticate step on this page.
        </p>
      );
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

/** Sticky-rail auth guidance keyed off recipe auth data, per build path. */
export function RecipeAuthCard({
  recipe,
}: {
  recipe: RecipeRecord;
}): React.ReactElement | null {
  const contexts = authContexts(recipe)
    .map((context) => ({
      ...context,
      entries: context.entries.filter((entry) => entry.kind !== 'none'),
    }))
    .filter((context) => context.entries.length > 0);

  if (contexts.length === 0) {
    return null;
  }

  return (
    <div className={styles.railCard}>
      <div className={styles.railLabel}>Auth</div>
      <div className={styles.authBody}>
        {contexts.map((context, contextIndex) => (
          <div
            className={styles.authBody}
            key={context.label ?? `auth-${contextIndex}`}
          >
            {context.label && (
              <p>
                <strong>{context.label}</strong>
              </p>
            )}
            {context.entries.map((entry, entryIndex) => (
              <AuthBlock
                key={`${entry.kind}-${entryIndex}`}
                kind={entry.kind}
                scopeList={entry.scopes}
                login={entry.setupCommand}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
