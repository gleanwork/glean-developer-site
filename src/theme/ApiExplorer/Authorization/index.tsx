/**
 * Wraps the theme's Authorization panel with a "Sign in with Glean"
 * button: OAuth discovery + Dynamic Client Registration + PKCE against
 * the server URL configured in the explorer's Base URL field. On success
 * the access token is injected into the explorer's bearer-token state
 * (persisted like a pasted token). Client and Platform APIs — the
 * Indexing API requires a Glean-issued token instead.
 */
import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from '@docusaurus/router';
import Authorization from '@theme-original/ApiExplorer/Authorization';
import { useTypedDispatch, useTypedSelector } from '@theme/ApiItem/hooks';
import { setAuthData } from '@theme/ApiExplorer/Authorization/slice';
import {
  isOAuthEligiblePath,
  isPlaceholderServerUrl,
  signInWithGlean,
} from '@site/src/components/ApiOAuth/oauth';
import { useTenantApiPersonalizationEnabled } from '@site/src/lib/tenantPersonalizationFlag';
import {
  API_URL_PLACEHOLDERS,
  resolveOpenApiServerUrl,
  tenantApiUrlMatches,
  tenantProfileStore,
} from '@site/src/lib/tenantProfile';
import styles from './styles.module.css';

function resolveServerUrl(server: any): string {
  if (!server?.url) return '';
  let url: string = server.url;
  for (const [key, variable] of Object.entries<any>(server.variables ?? {})) {
    url = url.replace(`{${key}}`, variable.default ?? '');
  }
  return url.replace(/\/$/, '');
}

function GleanSignIn(): React.ReactElement | null {
  const personalizationEnabled = useTenantApiPersonalizationEnabled();
  const { pathname } = useLocation();
  const dispatch = useTypedDispatch();
  const server = useTypedSelector((state: any) => state.server.value);
  const serverRef = useRef(server);
  const personalizationEnabledRef = useRef(personalizationEnabled);
  const mountedRef = useRef(true);
  serverRef.current = server;
  personalizationEnabledRef.current = personalizationEnabled;
  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    [],
  );
  const auth = useTypedSelector((state: any) => state.auth);
  const [status, setStatus] = useState<
    { kind: 'idle' | 'busy' | 'done' } | { kind: 'error'; message: string }
  >({ kind: 'idle' });

  if (!isOAuthEligiblePath(pathname)) {
    return null;
  }

  // Bearer-type schemes on this operation — the flow fills their token.
  const bearerSchemes: string[] = (auth?.options?.[auth?.selected] ?? [])
    .filter(
      (s: any) =>
        s?.type === 'http' && `${s?.scheme}`.toLowerCase() === 'bearer',
    )
    .map((s: any) => s.key);

  if (bearerSchemes.length === 0) {
    return null;
  }

  const signIn = async () => {
    const serverUrl = personalizationEnabled
      ? resolveOpenApiServerUrl(server)
      : resolveServerUrl(server);
    const hasPlaceholder =
      serverUrl &&
      (isPlaceholderServerUrl(serverUrl) ||
        API_URL_PLACEHOLDERS.some((url) => url === serverUrl));
    if (!serverUrl || hasPlaceholder) {
      setStatus({
        kind: 'error',
        message: personalizationEnabled
          ? 'Find or enter your Glean API URL under Base URL first.'
          : 'Set your server URL under Base URL first.',
      });
      return;
    }
    setStatus({ kind: 'busy' });
    try {
      const token = await signInWithGlean(serverUrl);
      const liveServerUrl = resolveOpenApiServerUrl(serverRef.current);
      if (!mountedRef.current || liveServerUrl !== serverUrl) {
        throw new Error(
          'Your Glean API URL changed during sign-in. Sign in again for the current URL.',
        );
      }
      if (
        personalizationEnabledRef.current &&
        !tenantApiUrlMatches(tenantProfileStore.getSnapshot(), serverUrl)
      ) {
        throw new Error(
          'Your Glean API URL changed during sign-in. Sign in again for the current URL.',
        );
      }
      for (const scheme of bearerSchemes) {
        dispatch(setAuthData({ scheme, key: 'token', value: token }));
      }
      setStatus({ kind: 'done' });
    } catch (error) {
      setStatus({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Sign-in failed.',
      });
    }
  };

  return (
    <div className={styles.oauthRow}>
      <button
        className={styles.oauthBtn}
        disabled={status.kind === 'busy'}
        onClick={signIn}
        type="button"
      >
        {status.kind === 'busy'
          ? 'Signing in…'
          : status.kind === 'done'
            ? 'Signed in ✓ — sign in again'
            : 'Sign in with Glean'}
      </button>
      <span className={styles.oauthHint}>
        {status.kind === 'error'
          ? status.message
          : status.kind === 'done'
            ? 'OAuth token filled in below.'
            : 'OAuth sign-in against your instance — or paste a token below.'}
      </span>
    </div>
  );
}

export default function AuthorizationWrapper(
  props: Record<string, unknown>,
): React.ReactElement {
  return (
    <>
      <GleanSignIn />
      <Authorization {...props} />
    </>
  );
}
