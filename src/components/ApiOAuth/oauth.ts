/**
 * Browser-side OAuth for the API Explorer: discovery → Dynamic Client
 * Registration → PKCE authorization-code flow, all against the reader's
 * own Glean instance. No client secret (public client), no server-side
 * component on this site — tokens live only in the reader's browser.
 *
 * Endpoints are discovered from {serverUrl}/.well-known/oauth-authorization-server
 * (verified live: issuer, authorization/token/registration endpoints, PKCE
 * S256, token_endpoint_auth_method "none", refresh_token grant).
 *
 * Sign-in also keeps a refresh token so the explorer can renew the access
 * token when it expires instead of asking the reader to sign in again. The
 * refresh token is stored in localStorage next to the access token the
 * explorer already persists there. Glean rotates refresh tokens on every use
 * and rejects a reused one, so refreshes are serialized across tabs with a
 * Web Lock. Every write also checks that the stored session has not changed
 * since the refresh started, so a late response never overwrites a newer
 * sign-in.
 */

const CLIENT_ID_STORE = 'api-explorer-oauth-clients';
const SESSION_STORE = 'api-explorer-oauth-signed-in';
const REFRESH_LOCK = 'api-explorer-oauth-refresh';
const CLIENT_NAME = 'Glean Developer Docs API Explorer';
const GRANT_TYPES = ['authorization_code', 'refresh_token'];

/** Refresh this long before the access token expires, so a request sent
 * just before expiry still carries a valid token. */
export const REFRESH_LEAD_MS = 2 * 60 * 1000;

/** True when another tab changed the stored sign-in. A `null` key means
 * that tab cleared all of localStorage. */
export function isSignInStorageEvent(event: StorageEvent): boolean {
  return event.key === SESSION_STORE || event.key === null;
}

interface ServerMetadata {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  registration_endpoint?: string;
  scopes_supported?: string[];
}

interface CachedClient {
  clientId: string;
  scope: string;
  grantTypes?: string[];
}

interface TokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number | string;
}

interface Tokens {
  accessToken: string;
  refreshToken?: string;
  /** Epoch milliseconds; absent when the server sent no expires_in. */
  expiresAt?: number;
}

/** What a completed sign-in returns: the tokens plus what a later refresh
 * needs to call the token endpoint again. */
export interface SignInResult extends Tokens {
  clientId: string;
  tokenEndpoint: string;
}

export interface SignInSession extends SignInResult {
  serverUrl: string;
  /** Random per sign-in and kept across refreshes, so a tab can tell its
   * own sign-in, refreshed by another tab, from a newer sign-in. */
  id: string;
  /** Counts successful refreshes within this sign-in. */
  generation: number;
  /** The access token the last refresh replaced. A page that closed while
   * the refresh was in flight still holds it, and picks up the new one. */
  previousAccessToken?: string;
}

/** `signed-in`: the token came from signing in and has not expired.
 * `expired`: it came from signing in but has expired.
 * `signed-out`: no sign-in issued it, for example a pasted token. */
export type SignInState = 'signed-in' | 'expired' | 'signed-out';

/** Format every scope advertised by the authorization server for an OAuth
 * authorization request. The API Explorer intentionally requests the complete
 * set so one sign-in can be reused while exploring different endpoints. */
export function allSupportedScopes(scopes: string[] | undefined): string {
  if (!scopes?.length) {
    throw new Error(
      'This server does not advertise any supported OAuth scopes.',
    );
  }
  return scopes.join(' ');
}

/** OAuth tokens work on the Client and Platform APIs; the Indexing API
 * requires a Glean-issued token. */
export function isOAuthEligiblePath(pathname: string): boolean {
  return /\/api\/(client-api|platform-api)\//.test(pathname);
}

/** True when the explorer Base URL is still the OpenAPI placeholder. */
export function isPlaceholderServerUrl(serverUrl: string): boolean {
  const value = serverUrl.toLowerCase();
  return (
    value.includes('{instance-name}') ||
    value.includes('instance-name-be.glean.com')
  );
}

function normalizeServerUrl(serverUrl: string): string {
  return serverUrl.replace(/\/+$/, '');
}

function readSession(): SignInSession | null {
  try {
    const record = JSON.parse(localStorage.getItem(SESSION_STORE) ?? 'null');
    // Records written before refresh support hold only a fingerprint.
    if (
      typeof record?.serverUrl !== 'string' ||
      typeof record.id !== 'string' ||
      typeof record.generation !== 'number' ||
      typeof record.accessToken !== 'string' ||
      typeof record.clientId !== 'string' ||
      typeof record.tokenEndpoint !== 'string'
    ) {
      return null;
    }
    return record as SignInSession;
  } catch {
    return null;
  }
}

function writeSession(session: SignInSession): void {
  try {
    localStorage.setItem(SESSION_STORE, JSON.stringify(session));
  } catch {
    // Storage unavailable; the session just won't survive a reload.
  }
}

/** Record the sign-in for `serverUrl`, so the signed-in state survives a
 * reload and the access token can be refreshed later. */
export function rememberSignedIn(
  serverUrl: string,
  result: SignInResult,
): void {
  writeSession({
    ...result,
    serverUrl: normalizeServerUrl(serverUrl),
    id: base64Url(crypto.getRandomValues(new Uint8Array(16))),
    generation: 0,
  });
}

/** The stored sign-in for `serverUrl`, whichever token it currently holds. */
export function getSignInSession(
  serverUrl: string | null,
): SignInSession | null {
  if (!serverUrl) {
    return null;
  }
  const session = readSession();
  return session?.serverUrl === normalizeServerUrl(serverUrl) ? session : null;
}

function isExpired(session: SignInSession, now: number): boolean {
  return session.expiresAt !== undefined && now >= session.expiresAt;
}

function holdsSessionToken(
  session: SignInSession | null,
  token: string | undefined,
): session is SignInSession {
  return (
    Boolean(token) &&
    session !== null &&
    (token === session.accessToken || token === session.previousAccessToken)
  );
}

/** Whether `token` came from signing in to `serverUrl`, and whether that
 * sign-in has expired. A pasted token or a changed Base URL counts as
 * signed out. */
export function signInState(
  serverUrl: string | null,
  token: string | undefined,
  now: number = Date.now(),
): SignInState {
  const session = getSignInSession(serverUrl);
  if (!holdsSessionToken(session, token)) {
    return 'signed-out';
  }
  return isExpired(session, now) ? 'expired' : 'signed-in';
}

function parseTokenResponse(body: TokenResponse, now: number): Tokens {
  if (!body.access_token) {
    throw new Error('Token response contained no access token.');
  }
  const expiresIn = Number(body.expires_in);
  return {
    accessToken: body.access_token,
    refreshToken: body.refresh_token || undefined,
    expiresAt:
      Number.isFinite(expiresIn) && expiresIn > 0
        ? now + expiresIn * 1000
        : undefined,
  };
}

/** Run `fn` while holding a lock shared by every tab on this origin. */
async function withRefreshLock<T>(fn: () => Promise<T>): Promise<T> {
  const locks = typeof navigator === 'undefined' ? undefined : navigator.locks;
  return locks ? locks.request(REFRESH_LOCK, fn) : fn();
}

/**
 * Exchange the stored refresh token for a new access token. `token` is the
 * access token this page holds, from the sign-in with id `sessionId`.
 * Resolves to the token the page should use now, or to null when there is
 * nothing to refresh with or a newer sign-in replaced that one. Throws on a
 * network error, which leaves the refresh token in place for a later try.
 *
 * Glean rotates the refresh token on every use, so only one tab may refresh
 * at a time. A tab that waited for the lock picks up the token the other tab
 * stored instead of refreshing again with a refresh token already spent.
 */
export async function refreshSignIn(
  serverUrl: string,
  token: string,
  sessionId: string,
): Promise<string | null> {
  return withRefreshLock(async () => {
    const session = getSignInSession(serverUrl);
    if (session?.id !== sessionId) {
      return null;
    }
    if (token !== session.accessToken && !isExpired(session, Date.now())) {
      // Another tab, or this page before a reload, already refreshed.
      return session.accessToken;
    }
    if (!session.refreshToken) {
      return null;
    }
    const res = await fetch(session.tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: session.clientId,
        refresh_token: session.refreshToken,
      }),
    });
    const tokens = res.ok
      ? parseTokenResponse(await res.json(), Date.now())
      : null;

    // The reader may have signed in again while the request was in flight,
    // or, without Web Locks, another tab may have refreshed. Write only if
    // the stored session is still this sign-in at this generation.
    const latest = getSignInSession(serverUrl);
    if (latest?.id !== session.id || latest.generation !== session.generation) {
      return latest?.id === session.id && !isExpired(latest, Date.now())
        ? latest.accessToken
        : null;
    }

    if (!tokens) {
      if (res.status === 400 || res.status === 401) {
        // Expired, revoked or already used: signing in again is the only fix.
        writeSession({ ...latest, refreshToken: undefined });
      }
      return null;
    }
    // Written over `session`, not `latest`: a duplicate request rejected
    // first may have cleared the refresh token this response replaces.
    writeSession({
      ...session,
      ...tokens,
      // With rotation off the server keeps the old refresh token valid.
      refreshToken: tokens.refreshToken ?? session.refreshToken,
      previousAccessToken: session.accessToken,
      generation: session.generation + 1,
    });
    return tokens.accessToken;
  });
}

function base64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function pkcePair(): Promise<{ verifier: string; challenge: string }> {
  const verifier = base64Url(crypto.getRandomValues(new Uint8Array(32)));
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(verifier),
  );
  return { verifier, challenge: base64Url(new Uint8Array(digest)) };
}

async function discover(serverUrl: string): Promise<ServerMetadata> {
  const origin = new URL(serverUrl).origin;
  const res = await fetch(`${origin}/.well-known/oauth-authorization-server`);
  if (!res.ok) {
    throw new Error(
      `This server does not advertise OAuth metadata (HTTP ${res.status}).`,
    );
  }
  return res.json();
}

/** Register (or reuse) a public client for this issuer and scope set via DCR. */
async function getClientId(
  metadata: ServerMetadata,
  scope: string,
): Promise<string> {
  let cache: Record<string, CachedClient> = {};
  try {
    cache = JSON.parse(localStorage.getItem(CLIENT_ID_STORE) ?? '{}');
  } catch {
    // Corrupt cache; re-register.
  }
  const cachedClient = cache[metadata.issuer];
  // Clients registered before refresh support lack the refresh_token grant,
  // and the server issues refresh tokens only to clients that have it.
  if (
    cachedClient?.scope === scope &&
    GRANT_TYPES.every((grant) => cachedClient.grantTypes?.includes(grant))
  ) {
    return cachedClient.clientId;
  }
  if (!metadata.registration_endpoint) {
    throw new Error(
      'This server does not support Dynamic Client Registration.',
    );
  }
  const res = await fetch(metadata.registration_endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_name: CLIENT_NAME,
      redirect_uris: [`${window.location.origin}/oauth/callback`],
      grant_types: GRANT_TYPES,
      response_types: ['code'],
      token_endpoint_auth_method: 'none',
      scope,
    }),
  });
  if (!res.ok) {
    throw new Error(`Client registration failed (HTTP ${res.status}).`);
  }
  const { client_id: clientId } = await res.json();
  cache[metadata.issuer] = { clientId, scope, grantTypes: GRANT_TYPES };
  localStorage.setItem(CLIENT_ID_STORE, JSON.stringify(cache));
  return clientId;
}

/** Run the authorization-code flow in a popup; resolve to the code. */
function authorizeInPopup(
  metadata: ServerMetadata,
  clientId: string,
  challenge: string,
  scope: string | undefined,
): Promise<string> {
  const state = base64Url(crypto.getRandomValues(new Uint8Array(16)));
  const url = new URL(metadata.authorization_endpoint);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set(
    'redirect_uri',
    `${window.location.origin}/oauth/callback`,
  );
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('code_challenge', challenge);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('state', state);
  if (scope) {
    url.searchParams.set('scope', scope);
  }

  return new Promise((resolve, reject) => {
    const popup = window.open(
      url.toString(),
      'glean-oauth',
      'width=520,height=680',
    );
    if (!popup) {
      reject(new Error('Popup blocked — allow popups for this site.'));
      return;
    }
    const cleanup = () => {
      window.removeEventListener('message', onMessage);
      clearInterval(watchdog);
    };
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return;
      }
      const { type, code, state: gotState, error } = event.data ?? {};
      if (type !== 'glean-oauth-callback') {
        return;
      }
      cleanup();
      if (error) {
        reject(new Error(`Authorization failed: ${error}`));
      } else if (gotState !== state) {
        reject(new Error('Authorization failed: state mismatch.'));
      } else {
        resolve(code);
      }
    };
    const watchdog = setInterval(() => {
      if (popup.closed) {
        cleanup();
        reject(new Error('Sign-in window was closed.'));
      }
    }, 500);
    window.addEventListener('message', onMessage);
  });
}

async function exchangeCode(
  metadata: ServerMetadata,
  clientId: string,
  code: string,
  verifier: string,
): Promise<Tokens> {
  const res = await fetch(metadata.token_endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      code,
      code_verifier: verifier,
      redirect_uri: `${window.location.origin}/oauth/callback`,
    }),
  });
  if (!res.ok) {
    throw new Error(`Token exchange failed (HTTP ${res.status}).`);
  }
  return parseTokenResponse(await res.json(), Date.now());
}

/** Full flow: discovery → DCR → PKCE popup → tokens. */
export async function signInWithGlean(
  serverUrl: string,
): Promise<SignInResult> {
  const metadata = await discover(serverUrl);
  const scope = allSupportedScopes(metadata.scopes_supported);
  const clientId = await getClientId(metadata, scope);
  const { verifier, challenge } = await pkcePair();
  const code = await authorizeInPopup(metadata, clientId, challenge, scope);
  const tokens = await exchangeCode(metadata, clientId, code, verifier);
  return { ...tokens, clientId, tokenEndpoint: metadata.token_endpoint };
}
