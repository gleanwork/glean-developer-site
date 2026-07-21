import express from 'express';
import session from 'express-session';
import * as client from 'openid-client';
import { Glean } from '@gleanwork/api-client';

const app = express();
app.use(session({ secret: 'change-me', resave: false, saveUninitialized: false }));

let config: client.Configuration;
async function init() {
  config = await client.discovery(
    new URL(process.env.OAUTH_ISSUER!),
    process.env.OAUTH_CLIENT_ID!,
    process.env.OAUTH_CLIENT_SECRET, // omit for a public client
  );
}

app.get('/login', async (req, res) => {
  // PKCE values must be generated per request and stored in the session.
  const codeVerifier = client.randomPKCECodeVerifier();
  const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);
  (req.session as any).codeVerifier = codeVerifier;

  const params: Record<string, string> = {
    redirect_uri: 'http://localhost:3000/callback',
    scope: 'openid offline_access SEARCH', // SEARCH lets the token call /search (a Glean scope); offline_access requests a refresh token
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  };
  // state is only needed if the server doesn't advertise PKCE support
  if (!config.serverMetadata().supportsPKCE()) {
    const state = client.randomState();
    (req.session as any).state = state;
    params.state = state;
  }
  res.redirect(client.buildAuthorizationUrl(config, params).href);
});

app.get('/callback', async (req, res) => {
  const currentUrl = new URL(req.url, `http://${req.headers.host}`);
  const tokens = await client.authorizationCodeGrant(config, currentUrl, {
    pkceCodeVerifier: (req.session as any).codeVerifier,
    expectedState: (req.session as any).state, // undefined when PKCE is used
  });

  const glean = new Glean({
    apiToken: tokens.access_token,
    serverURL: process.env.GLEAN_SERVER_URL!,
  });

  const results = await glean.client.search.query(
    { query: 'quarterly reports', pageSize: 10 },
    undefined,
    // Omit these headers when the token is from the Glean Authorization Server.
    { fetchOptions: { headers: { 'X-Glean-Auth-Type': 'OAUTH' } } },
  );
  res.json(results);
});

init().then(() => app.listen(3000));
