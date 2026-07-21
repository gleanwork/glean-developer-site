// SearchController.java — exchange the authorized client's token for a Glean call
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.annotation.RegisteredOAuth2AuthorizedClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import com.glean.api_client.glean_api_client.Glean;
import com.glean.api_client.glean_api_client.models.components.*;
import java.util.List;

@RestController
public class SearchController {
  @Value("${glean.server-url}")
  private String serverURL;

  @GetMapping("/search")
  public List<SearchResult> search(
      @RegisteredOAuth2AuthorizedClient("glean") OAuth2AuthorizedClient authorizedClient)
      throws Exception {
    String accessToken = authorizedClient.getAccessToken().getTokenValue();

    // For external-IdP tokens, add a custom HTTPClient that sets
    // X-Glean-Auth-Type: OAUTH (see "OAuth Access Tokens" above). Glean
    // Authorization Server tokens need no extra header.
    Glean glean = Glean.builder()
        .apiToken(accessToken)
        .serverURL(serverURL)
        .build();

    return glean.client().search().query()
        .searchRequest(SearchRequest.builder()
            .query("quarterly reports")
            .pageSize(10L)
            .build())
        .call()
        .searchResponse()
        .map(SearchResponse::results)
        .orElse(List.of());
  }
}
