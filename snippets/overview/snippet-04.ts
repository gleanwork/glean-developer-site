{
  authMethod: "token",
  authToken: "GLEAN_AUTH_TOKEN_...",
  onAuthTokenRequired: async () => {
    // Fetch new token when current one expires
    return newToken;
  }
}
