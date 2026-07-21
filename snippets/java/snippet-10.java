import com.glean.api_client.glean_api_client.utils.HTTPClient;
import com.glean.api_client.glean_api_client.utils.SpeakeasyHTTPClient;
import com.glean.api_client.glean_api_client.utils.Utils;
import java.io.InputStream;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

HTTPClient oauthClient = new SpeakeasyHTTPClient() {
  @Override
  public HttpResponse<InputStream> send(HttpRequest request)
      throws java.io.IOException, InterruptedException, java.net.URISyntaxException {
    return super.send(Utils.copy(request)
        .header("X-Glean-Auth-Type", "OAUTH")
        .build());
  }
};

Glean client = Glean.builder()
    .apiToken(oauthAccessToken)
    .serverURL("https://your-server-id-be.glean.com")
    .client(oauthClient)
    .build();
