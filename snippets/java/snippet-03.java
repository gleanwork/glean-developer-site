public class ChatService {
  private final Glean client;
  
  public ChatService(String apiToken, String serverURL) {
    this.client = Glean.builder()
        .apiToken(apiToken)
        .serverURL(serverURL)
        .build();
  }
  
  public String sendMessage(String message) throws Exception {
    var response = client.client().chat().create()
        .chatRequest(ChatRequest.builder()
            .messages(List.of(
                ChatMessage.builder()
                    .fragments(List.of(
                        ChatMessageFragment.builder()
                            .text(message)
                            .build()))
                    .build()))
            .build())
        .call();
        
    return response.chatResponse()
        .map(chat -> chat.messages().stream()
            .flatMap(msg -> msg.fragments().stream())
            .map(fragment -> fragment.text().orElse(""))
            .collect(Collectors.joining()))
        .orElse("No response");
  }
}
