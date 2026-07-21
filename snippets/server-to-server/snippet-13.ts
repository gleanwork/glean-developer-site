// Get the auth token
const token = await authProvider.getAuthToken();

// Render a component with the token
GleanWebSDK.renderSearchBox(document.getElementById('search-container'), {
  authMethod: 'token',
  authToken: token,
  backend: 'https://{your}-be.glean.com/',
  onAuthTokenRequired: async () => {
    return await authProvider.getAuthToken();
  }
});
