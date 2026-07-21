@RestController
@RequestMapping("/api")
public class GleanController {
  
  private final Glean gleanClient;
  
  public GleanController(Glean gleanClient) {
    this.gleanClient = gleanClient;
  }
  
  @PostMapping("/chat")
  public ResponseEntity<String> chat(@RequestBody Map<String, String> request) {
    try {
      String message = request.get("message");
      
      var response = gleanClient.client().chat().create()
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
          
      String responseText = response.chatResponse()
          .map(chat -> chat.messages().stream()
              .flatMap(msg -> msg.fragments().stream())
              .map(fragment -> fragment.text().orElse(""))
              .collect(Collectors.joining()))
          .orElse("No response");
          
      return ResponseEntity.ok(responseText);
    } catch (Exception e) {
      return ResponseEntity.status(500).body("Error: " + e.getMessage());
    }
  }
}
