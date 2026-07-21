s := apiclientgo.New(
  apiclientgo.WithSecurity(oauthAccessToken),
  apiclientgo.WithServerURL("https://instance-name-be.glean.com"),
)
