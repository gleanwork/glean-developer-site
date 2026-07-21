func batchSearch(s *apiclientgo.Glean, queries []string) ([]*components.SearchResponse, error) {
  ctx := context.Background()
  results := make([]*components.SearchResponse, len(queries))
  errs := make([]error, len(queries))

  var wg sync.WaitGroup

  for i, query := range queries {
    wg.Add(1)
    go func(index int, q string) {
      defer wg.Done()

      res, err := s.Client.Search.Query(ctx, components.SearchRequest{
        Query: q,
      }, nil)
      if err != nil {
        errs[index] = err
        return
      }

      results[index] = res.SearchResponse
    }(i, query)
  }

  wg.Wait()

  // Check for errors
  for _, err := range errs {
    if err != nil {
      return nil, err
    }
  }

  return results, nil
}
