/**
 * Browser-side OAuth for the API Explorer: discovery → Dynamic Client
 * Registration → PKCE authorization-code flow, all against the reader's
 * own Glean instance. No client secret (public client), no server-side
 * component on this site — tokens live only in the reader's browser.
 *
 * Endpoints are discovered from {serverUrl}/.well-known/oauth-authorization-server
 * (verified live: issuer, authorization/token/registration endpoints, PKCE
 * S256, token_endpoint_auth_method "none").
 */

const CLIENT_ID_STORE = 'api-explorer-oauth-clients';
const SIGNED_IN_STORE = 'api-explorer-oauth-signed-in';
const CLIENT_NAME = 'Glean Developer Docs API Explorer';

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
}

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

/** The token a sign-in issued, and when it expires (epoch ms) if the
 * server said. */
export interface SignInResult {
  accessToken: string;
  expiresAt?: number;
}

/** `expired` means the explorer still holds the token sign-in issued, but
 * the token has expired. */
export type SignInState = 'signed-in' | 'expired' | 'signed-out';

interface SignedInRecord {
  serverUrl: string;
  tokenFingerprint: string;
  expiresAt?: number;
}

/** FNV-1a hash. Identifies the token sign-in issued without storing a
 * second copy of it; the explorer already persists the token itself. */
function fingerprint(token: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < token.length; i++) {
    hash ^= token.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16);
}

function normalizeServerUrl(serverUrl: string): string {
  return serverUrl.replace(/\/+$/, '');
}

/** Record that the token in `result` came from signing in to `serverUrl`,
 * so the signed-in state survives a page reload. */
export function rememberSignedIn(
  serverUrl: string,
  result: SignInResult,
): void {
  const record: SignedInRecord = {
    serverUrl: normalizeServerUrl(serverUrl),
    tokenFingerprint: fingerprint(result.accessToken),
    expiresAt: result.expiresAt,
  };
  try {
    localStorage.setItem(SIGNED_IN_STORE, JSON.stringify(record));
  } catch {
    // Storage unavailable; the signed-in state just won't survive a reload.
  }
}

/** Whether `token` is the one sign-in issued for `serverUrl`, and whether
 * it has expired. A pasted token or a changed Base URL is `signed-out`. */
export function signInState(
  serverUrl: string | null,
  token: string | undefined,
  now: number = Date.now(),
): SignInState {
  if (!serverUrl || !token) {
    return 'signed-out';
  }
  let record: SignedInRecord | null = null;
  try {
    record = JSON.parse(localStorage.getItem(SIGNED_IN_STORE) ?? 'null');
  } catch {
    return 'signed-out';
  }
  if (
    record?.serverUrl !== normalizeServerUrl(serverUrl) ||
    record.tokenFingerprint !== fingerprint(token)
  ) {
    return 'signed-out';
  }
  return record.expiresAt !== undefined && now >= record.expiresAt
    ? 'expired'
    : 'signed-in';
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
  if (cachedClient?.scope === scope) {
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
      grant_types: ['authorization_code'],
      response_types: ['code'],
      token_endpoint_auth_method: 'none',
      scope,
    }),
  });
  if (!res.ok) {
    throw new Error(`Client registration failed (HTTP ${res.status}).`);
  }
  const { client_id: clientId } = await res.json();
  cache[metadata.issuer] = { clientId, scope };
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
): Promise<SignInResult> {
  const requestedAt = Date.now();
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
  const { access_token: accessToken, expires_in: expiresIn } = await res.json();
  if (!accessToken) {
    throw new Error('Token exchange returned no access token.');
  }
  // Count from when the request was sent, so the recorded expiry is never
  // later than the real one.
  const expiresAt =
    typeof expiresIn === 'number' && expiresIn > 0
      ? requestedAt + expiresIn * 1000
      : undefined;
  return { accessToken, expiresAt };
}

/** Full flow: discovery → DCR → PKCE popup → token. */
export async function signInWithGlean(
  serverUrl: string,
): Promise<SignInResult> {
  const metadata = await discover(serverUrl);
  const scope = allSupportedScopes(metadata.scopes_supported);
  const clientId = await getClientId(metadata, scope);
  const { verifier, challenge } = await pkcePair();
  const code = await authorizeInPopup(metadata, clientId, challenge, scope);
  return exchangeCode(metadata, clientId, code, verifier);
}
