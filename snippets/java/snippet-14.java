public String safeChat(Glean client, String message) {
  try {
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
  } catch (Exception e) {
    System.err.println("API error: " + e.getMessage());
    return "Sorry, I couldn't process your request.";
  }
}
