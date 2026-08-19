import type React from 'react';
import Link from '@docusaurus/Link';
import type { RecipeRecord } from '../../types/recipe';
import styles from './RecipeLayout.module.css';

const FIND_SERVER = '/get-started/authentication#finding-your-server-url';
const CLIENT_TOKEN = '/api-info/client/authentication/glean-issued';
const INDEXING_TOKEN = '/api-info/indexing/authentication/overview';
const OAUTH = '/api-info/client/authentication/oauth';
const TOKEN_MGMT_CLIENT =
  'https://app.glean.com/admin/platform/tokenManagement?tab=client';
const TOKEN_MGMT_INDEXING =
  'https://app.glean.com/admin/platform/tokenManagement?tab=indexing';

type AuthKind = NonNullable<RecipeRecord['execution']>['auth'][number]['kind'];

function kindsFromRecipe(recipe: RecipeRecord): AuthKind[] {
  const declared = recipe.execution?.auth.map((entry) => entry.kind) ?? [];
  if (declared.length > 0) {
    return [...new Set(declared)];
  }
  const mapped: AuthKind[] = [];
  for (const method of recipe.authMethod) {
    if (method === 'web-sdk-cookie') {
      mapped.push('browser-cookie');
    } else if (method === 'client-api-oauth-or-token') {
      mapped.push('oauth-with-token-fallback');
    } else if (method === 'indexing-token') {
      mapped.push('indexing-token');
    }
  }
  return [...new Set(mapped)];
}

function setupCommand(recipe: RecipeRecord): string | undefined {
  return recipe.execution?.auth.find((entry) => entry.setupCommand)
    ?.setupCommand;
}

function AuthBlock({
  kind,
  recipe,
}: {
  kind: AuthKind;
  recipe: RecipeRecord;
}): React.ReactElement | null {
  const login = setupCommand(recipe);
  const scopes = recipe.requiredScopes.join(', ');

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

/** Sticky-rail auth guidance keyed off recipe auth data. */
export function RecipeAuthCard({
  recipe,
}: {
  recipe: RecipeRecord;
}): React.ReactElement | null {
  const kinds = kindsFromRecipe(recipe).filter((kind) => kind !== 'none');
  if (kinds.length === 0) {
    return null;
  }

  return (
    <div className={styles.railCard}>
      <div className={styles.railLabel}>Auth</div>
      <div className={styles.authBody}>
        {kinds.map((kind) => (
          <AuthBlock key={kind} kind={kind} recipe={recipe} />
        ))}
      </div>
    </div>
  );
}
