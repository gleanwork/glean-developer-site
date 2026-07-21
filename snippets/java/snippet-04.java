public class SearchService {
  private final Glean client;
  
  public SearchService(String apiToken, String serverURL) {
    this.client = Glean.builder()
        .apiToken(apiToken)
        .serverURL(serverURL)
        .build();
  }
  
  public List<SearchResult> search(String query) throws Exception {
    var response = client.client().search().query()
        .searchRequest(SearchRequest.builder()
            .query(query)
            .pageSize(10L)
            .build())
        .call();
        
    return response.searchResponse()
        .map(SearchResponse::results)
        .orElse(List.of());
  }
}
