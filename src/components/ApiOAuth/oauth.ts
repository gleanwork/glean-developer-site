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
const CLIENT_NAME = 'Glean Developer Docs API Explorer';

interface ServerMetadata {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  registration_endpoint?: string;
  scopes_supported?: string[];
}

/** Map a client-api docs path segment to its OAuth scope. */
const PATH_SCOPES: Record<string, string> = {
  activity: 'activity',
  agents: 'agents',
  announcements: 'announcements',
  answers: 'answers',
  authentication: 'auth_token_creator',
  chat: 'chat',
  collections: 'collections',
  documents: 'documents',
  entities: 'entities',
  governance: 'data_governance',
  insights: 'insights',
  pins: 'pins',
  search: 'search',
  shortcuts: 'shortcuts',
  summarize: 'summarize',
  tools: 'tools',
  verification: 'verification',
};

/** Scope for the API group being viewed, from the docs path. */
export function scopeForPath(pathname: string): string | undefined {
  const match = pathname.match(/\/api\/client-api\/([^/]+)/);
  return match ? PATH_SCOPES[match[1]] : undefined;
}

/** OAuth is supported on the Client API only. */
export function isOAuthEligiblePath(pathname: string): boolean {
  return /\/api\/client-api\//.test(pathname);
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

/** Register (or reuse) a public client for this issuer via DCR. */
async function getClientId(metadata: ServerMetadata): Promise<string> {
  let cache: Record<string, string> = {};
  try {
    cache = JSON.parse(localStorage.getItem(CLIENT_ID_STORE) ?? '{}');
  } catch {
    // Corrupt cache; re-register.
  }
  if (cache[metadata.issuer]) {
    return cache[metadata.issuer];
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
    }),
  });
  if (!res.ok) {
    throw new Error(`Client registration failed (HTTP ${res.status}).`);
  }
  const { client_id: clientId } = await res.json();
  cache[metadata.issuer] = clientId;
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
): Promise<string> {
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
  const { access_token: accessToken } = await res.json();
  if (!accessToken) {
    throw new Error('Token exchange returned no access token.');
  }
  return accessToken;
}

/** Full flow: discovery → DCR → PKCE popup → token. */
export async function signInWithGlean(
  serverUrl: string,
  scope: string | undefined,
): Promise<string> {
  const metadata = await discover(serverUrl);
  const clientId = await getClientId(metadata);
  const { verifier, challenge } = await pkcePair();
  const code = await authorizeInPopup(metadata, clientId, challenge, scope);
  return exchangeCode(metadata, clientId, code, verifier);
}
