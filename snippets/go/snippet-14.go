package main

import (
  "context"
  "net/http"
  "net/http/httptest"
  "testing"

  apiclientgo "github.com/gleanwork/api-client-go"
  "github.com/gleanwork/api-client-go/models/components"
  "github.com/stretchr/testify/assert"
  "github.com/stretchr/testify/require"
)

func TestSearch(t *testing.T) {
  srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    w.Write([]byte(`{"results":[{"title":"Q4 Report","url":"https://example.com/q4"}]}`))
  }))
  defer srv.Close()

  s := apiclientgo.New(
    apiclientgo.WithSecurity("test-token"),
    apiclientgo.WithServerURL(srv.URL),
  )

  res, err := s.Client.Search.Query(context.Background(), components.SearchRequest{
    Query: "quarterly business review",
  }, nil)
  require.NoError(t, err)
  require.NotNil(t, res.SearchResponse)
  require.Len(t, res.SearchResponse.Results, 1)
  assert.Equal(t, "https://example.com/q4", res.SearchResponse.Results[0].URL)
}
