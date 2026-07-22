import React, { useEffect } from 'react';
import Head from '@docusaurus/Head';

/**
 * OAuth redirect target for the API Explorer's "Sign in with Glean" flow.
 * Relays the authorization code to the opener (same-origin only) and
 * closes itself. Not linked from anywhere; noindexed.
 */
export default function OAuthCallback(): React.ReactElement {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    window.opener?.postMessage(
      {
        type: 'glean-oauth-callback',
        code: params.get('code'),
        state: params.get('state'),
        error: params.get('error'),
      },
      window.location.origin,
    );
    window.close();
  }, []);

  return (
    <>
      <Head>
        <meta name="robots" content="noindex" />
        <title>Signing in…</title>
      </Head>
      <p style={{ fontFamily: 'sans-serif', padding: '2rem' }}>
        Completing sign-in… you can close this window.
      </p>
    </>
  );
}
