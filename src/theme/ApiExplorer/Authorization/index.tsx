/**
 * Wraps the theme's Authorization panel with a "Sign in with Glean"
 * button: OAuth discovery + Dynamic Client Registration + PKCE against
 * the server URL configured in the explorer's Base URL field. On success
 * the access token is injected into the explorer's bearer-token state
 * (persisted like a pasted token). The signed-in label is derived from
 * that persisted token, so it survives a reload, and the token is refreshed
 * before it expires. Client and Platform APIs — the
 * Indexing API requires a Glean-issued token instead.
 */
import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from '@docusaurus/router';
import Authorization from '@theme-original/ApiExplorer/Authorization';
import { useTypedDispatch, useTypedSelector } from '@theme/ApiItem/hooks';
import { setAuthData } from '@theme/ApiExplorer/Authorization/slice';
import {
  forgetSignIn,
  isOAuthEligiblePath,
  isPlaceholderServerUrl,
  rememberSignedIn,
  signInState,
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
import { useSignInRefresh } from './useSignInRefresh';

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
    { kind: 'idle' | 'busy' } | { kind: 'error'; message: string }
  >({ kind: 'idle' });

  const eligible = isOAuthEligiblePath(pathname);

  // Bearer-type schemes on this operation — the flow fills their token.
  const bearerSchemes: string[] = (auth?.options?.[auth?.selected] ?? [])
    .filter(
      (s: any) =>
        s?.type === 'http' && `${s?.scheme}`.toLowerCase() === 'bearer',
    )
    .map((s: any) => s.key);

  const serverUrl = personalizationEnabled
    ? resolveOpenApiServerUrl(server)
    : resolveServerUrl(server);

  // Derived from the persisted token rather than component state, so the
  // signed-in label survives a reload.
  const tokens: string[] = bearerSchemes
    .map((scheme) => auth?.data?.[scheme]?.token)
    .filter(Boolean);
  const token =
    tokens.find((value) => signInState(serverUrl, value) !== 'signed-out') ??
    tokens[0];
  const state = signInState(serverUrl, token);

  // When the reader clears or replaces the signed-in token, delete the
  // stored sign-in too, so its refresh token does not outlive the token the
  // reader can see. A refreshed token still counts as signed in, so a
  // refresh does not trigger this.
  const previousTokenRef = useRef(token);
  useEffect(() => {
    const previous = previousTokenRef.current;
    previousTokenRef.current = token;
    if (
      eligible &&
      previous &&
      previous !== token &&
      signInState(serverUrl, token) === 'signed-out'
    ) {
      forgetSignIn(previous);
    }
  }, [eligible, serverUrl, token]);

  const refreshing = useSignInRefresh(
    eligible ? serverUrl : null,
    token,
    (fresh) => {
      for (const scheme of bearerSchemes) {
        dispatch(setAuthData({ scheme, key: 'token', value: fresh }));
      }
    },
  );

  if (!eligible || bearerSchemes.length === 0) {
    return null;
  }

  const signIn = async () => {
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
      const result = await signInWithGlean(serverUrl);
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
      rememberSignedIn(serverUrl, result);
      for (const scheme of bearerSchemes) {
        dispatch(
          setAuthData({ scheme, key: 'token', value: result.accessToken }),
        );
      }
      setStatus({ kind: 'idle' });
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
          : state === 'signed-in'
            ? 'Signed in ✓ — sign in again'
            : state === 'expired'
              ? 'Sign in again'
              : 'Sign in with Glean'}
      </button>
      <span className={styles.oauthHint}>
        {status.kind === 'error'
          ? status.message
          : refreshing
            ? 'Refreshing your sign-in…'
            : state === 'signed-in'
              ? 'OAuth token filled in below.'
              : state === 'expired'
                ? 'Your sign-in expired. Sign in again for a new token.'
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
