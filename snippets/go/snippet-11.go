import (
  apiclientgo "github.com/gleanwork/api-client-go"
  "github.com/gleanwork/api-client-go/models/components"
  "github.com/gleanwork/api-client-go/models/operations"
)

res, err := s.Client.Search.Query(ctx, components.SearchRequest{
  Query: "quarterly reports",
}, nil, operations.WithSetHeaders(map[string]string{
  "X-Glean-Auth-Type": "OAUTH",
}))
