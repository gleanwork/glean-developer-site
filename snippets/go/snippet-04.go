package main

import (
  "context"
  "fmt"

  apiclientgo "github.com/gleanwork/api-client-go"
  "github.com/gleanwork/api-client-go/models/components"
)

func searchExample(s *apiclientgo.Glean) error {
  ctx := context.Background()

  res, err := s.Client.Search.Query(ctx, components.SearchRequest{
    Query:    "quarterly business review",
    PageSize: apiclientgo.Pointer[int64](10),
  }, nil)
  if err != nil {
    return err
  }

  if res.SearchResponse == nil {
    return nil
  }

  for _, result := range res.SearchResponse.Results {
    title := ""
    if result.Title != nil {
      title = *result.Title
    }
    fmt.Printf("Title: %s\n", title)
    fmt.Printf("URL: %s\n", result.URL)
  }

  return nil
}
