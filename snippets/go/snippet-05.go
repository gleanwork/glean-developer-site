package main

import (
  "net/http"

  "github.com/gin-gonic/gin"
  apiclientgo "github.com/gleanwork/api-client-go"
  "github.com/gleanwork/api-client-go/models/components"
)

type ChatRequest struct {
  Message string `json:"message"`
}

func setupRoutes(s *apiclientgo.Glean) *gin.Engine {
  r := gin.Default()

  r.POST("/chat", func(c *gin.Context) {
    var req ChatRequest
    if err := c.ShouldBindJSON(&req); err != nil {
      c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
      return
    }

    res, err := s.Client.Chat.Create(c.Request.Context(), components.ChatRequest{
      Messages: []components.ChatMessage{
        {
          Fragments: []components.ChatMessageFragment{
            {Text: apiclientgo.Pointer(req.Message)},
          },
        },
      },
    }, nil, nil)
    if err != nil {
      c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
      return
    }

    answer := ""
    if res.ChatResponse != nil {
      answer = chatAnswer(res.ChatResponse) // helper defined in the Chat API section
    }
    c.JSON(http.StatusOK, gin.H{"response": answer})
  })

  return r
}
