// Fetch initial token from your server
async function getGleanToken() {
  const response = await fetch('/api/get-glean-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userEmail: 'user@company.com' // The user's email, or other identifier used to retrieve their access token
    })
  });

  const data = await response.json();
  return data; // Returns { token, expirationTime }
}

// Initialize Web SDK with token-based auth
const authToken = await getGleanToken();

GleanWebSDK.renderSearchBox(document.getElementById('search-container'), {
  authMethod: 'token',
  authToken: authToken,
  backend: 'https://{your}-be.glean.com/',
  onAuthTokenRequired: async () => {
    // Called when token is approaching expiration
    return await getGleanToken();
  }
});
