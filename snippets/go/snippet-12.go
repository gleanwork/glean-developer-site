package main

import (
  "encoding/json"
  "net/http"
  "os"

  "golang.org/x/oauth2"
  apiclientgo "github.com/gleanwork/api-client-go"
  "github.com/gleanwork/api-client-go/models/components"
  "github.com/gleanwork/api-client-go/models/operations"
)

var (
  conf = &oauth2.Config{
    ClientID:     os.Getenv("OAUTH_CLIENT_ID"),
    ClientSecret: os.Getenv("OAUTH_CLIENT_SECRET"), // omit for a public client
    RedirectURL:  "http://localhost:8080/callback",
    Scopes:       []string{"openid", "offline_access", "SEARCH"}, // SEARCH lets the token call /search; offline_access → refresh token
    Endpoint: oauth2.Endpoint{
      AuthURL:  os.Getenv("OAUTH_AUTH_URL"),
      TokenURL: os.Getenv("OAUTH_TOKEN_URL"),
    },
  }
  // Demo only: generate and store the verifier per request (e.g. in session) in production.
  verifier = oauth2.GenerateVerifier()
)

func main() {
  http.HandleFunc("/login", func(w http.ResponseWriter, r *http.Request) {
    url := conf.AuthCodeURL("state", oauth2.AccessTypeOffline,
      oauth2.S256ChallengeOption(verifier))
    http.Redirect(w, r, url, http.StatusFound)
  })

  http.HandleFunc("/callback", func(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    tok, err := conf.Exchange(ctx, r.URL.Query().Get("code"), oauth2.VerifierOption(verifier))
    if err != nil {
      http.Error(w, err.Error(), http.StatusInternalServerError)
      return
    }

    s := apiclientgo.New(
      apiclientgo.WithSecurity(tok.AccessToken),
      apiclientgo.WithServerURL(os.Getenv("GLEAN_SERVER_URL")),
    )

    res, err := s.Client.Search.Query(ctx, components.SearchRequest{
      Query: "quarterly reports",
    }, nil, // Omit this option when the token is from the Glean Authorization Server.
      operations.WithSetHeaders(map[string]string{"X-Glean-Auth-Type": "OAUTH"}))
    if err != nil {
      http.Error(w, err.Error(), http.StatusInternalServerError)
      return
    }
    json.NewEncoder(w).Encode(res.SearchResponse)
  })

  http.ListenAndServe(":8080", nil)
}
