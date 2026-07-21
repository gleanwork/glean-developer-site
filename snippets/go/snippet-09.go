import (
  apiclientgo "github.com/gleanwork/api-client-go"
  "github.com/gleanwork/api-client-go/models/components"
  "github.com/gleanwork/api-client-go/models/operations"
)

res, err := s.Client.Chat.Create(ctx, components.ChatRequest{
  Messages: []components.ChatMessage{
    {
      Fragments: []components.ChatMessageFragment{
        {Text: apiclientgo.Pointer("Hello")},
      },
    },
  },
}, nil, nil, operations.WithSetHeaders(map[string]string{
  "X-Glean-ActAs": "user@company.com",
}))
