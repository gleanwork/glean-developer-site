const config = {
  authMethod: 'token',
  authToken: 'GLEAN_AUTH_TOKEN_...',
  onAuthTokenRequired: async () => {
    // Fetch a new token when the current one expires.
    return 'GLEAN_AUTH_TOKEN_...';
  },
};
