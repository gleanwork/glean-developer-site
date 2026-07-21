package main

import (
  "context"
  "errors"
  "fmt"
  "time"

  apiclientgo "github.com/gleanwork/api-client-go"
  "github.com/gleanwork/api-client-go/models/apierrors"
  "github.com/gleanwork/api-client-go/models/components"
)

func safeChat(s *apiclientgo.Glean, message string) (string, error) {
  ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
  defer cancel()

  res, err := s.Client.Chat.Create(ctx, components.ChatRequest{
    Messages: []components.ChatMessage{
      {
        Fragments: []components.ChatMessageFragment{
          {Text: apiclientgo.Pointer(message)},
        },
      },
    },
  }, nil, nil)
  if err != nil {
    var apiErr *apierrors.APIError
    if errors.As(err, &apiErr) {
      return "", fmt.Errorf("chat failed with status %d: %w", apiErr.StatusCode, apiErr)
    }
    return "", fmt.Errorf("chat error: %w", err)
  }

  if res.ChatResponse == nil {
    return "", nil
  }
  return chatAnswer(res.ChatResponse), nil // helper defined in the Chat API section
}
