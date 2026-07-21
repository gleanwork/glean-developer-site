GleanWebSDK.renderSearchBox(document.getElementById('search-container'), {
  authMethod: 'token',
  authToken: yourAuthToken,
  backend: 'https://{your}-be.glean.com/',
  onAuthTokenRequired: async () => {
    const response = await fetch('/api/get-glean-token');
    const { token } = await response.json();
    return token;
  }
});
