package main

import (
  "context"
  "fmt"
  "strings"

  apiclientgo "github.com/gleanwork/api-client-go"
  "github.com/gleanwork/api-client-go/models/components"
)

// chatAnswer concatenates the text fragments of a chat response.
func chatAnswer(resp *components.ChatResponse) string {
  var sb strings.Builder
  for _, msg := range resp.Messages {
    for _, frag := range msg.Fragments {
      if frag.Text != nil {
        sb.WriteString(*frag.Text)
      }
    }
  }
  return sb.String()
}

func chatExample(s *apiclientgo.Glean) error {
  ctx := context.Background()

  res, err := s.Client.Chat.Create(ctx, components.ChatRequest{
    Messages: []components.ChatMessage{
      {
        Fragments: []components.ChatMessageFragment{
          {Text: apiclientgo.Pointer("Explain our Q4 strategy")},
        },
      },
    },
  }, nil, nil)
  if err != nil {
    return err
  }

  if res.ChatResponse != nil {
    fmt.Println(chatAnswer(res.ChatResponse))
  }
  return nil
}
