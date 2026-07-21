package main

import (
  "context"
  "fmt"
  "log"
  "os"

  apiclientgo "github.com/gleanwork/api-client-go"
  "github.com/gleanwork/api-client-go/models/components"
)

func main() {
  ctx := context.Background()

  s := apiclientgo.New(
    apiclientgo.WithSecurity(os.Getenv("GLEAN_API_TOKEN")),
    apiclientgo.WithInstance(os.Getenv("GLEAN_INSTANCE")),
  )

  res, err := s.Client.Chat.Create(ctx, components.ChatRequest{
    Messages: []components.ChatMessage{
      {
        Fragments: []components.ChatMessageFragment{
          {Text: apiclientgo.Pointer("What are our company values?")},
        },
      },
    },
  }, nil, nil)
  if err != nil {
    log.Fatal(err)
  }

  if res.ChatResponse != nil {
    for _, msg := range res.ChatResponse.Messages {
      for _, frag := range msg.Fragments {
        if frag.Text != nil {
          fmt.Print(*frag.Text)
        }
      }
    }
    fmt.Println()
  }
}
