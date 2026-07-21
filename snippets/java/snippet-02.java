import com.glean.api_client.glean_api_client.Glean;
import com.glean.api_client.glean_api_client.models.components.*;
import java.util.List;

public class GleanExample {
  public static void main(String[] args) throws Exception {
    Glean client = Glean.builder()
        .apiToken(System.getenv("GLEAN_API_TOKEN"))
        .serverURL(System.getenv("GLEAN_SERVER_URL"))
        .build();

    var response = client.client().chat().create()
        .chatRequest(ChatRequest.builder()
            .messages(List.of(
                ChatMessage.builder()
                    .fragments(List.of(
                        ChatMessageFragment.builder()
                            .text("What are our company values?")
                            .build()))
                    .build()))
            .build())
        .call();

    if (response.chatResponse().isPresent()) {
      System.out.println(response.chatResponse().get());
    }
  }
}
