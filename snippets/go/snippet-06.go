import (
  "net/http"

  "github.com/labstack/echo/v4"
  apiclientgo "github.com/gleanwork/api-client-go"
  "github.com/gleanwork/api-client-go/models/components"
)

func chatHandler(s *apiclientgo.Glean) echo.HandlerFunc {
  return func(c echo.Context) error {
    var req ChatRequest
    if err := c.Bind(&req); err != nil {
      return echo.NewHTTPError(http.StatusBadRequest, err.Error())
    }

    res, err := s.Client.Chat.Create(c.Request().Context(), components.ChatRequest{
      Messages: []components.ChatMessage{
        {
          Fragments: []components.ChatMessageFragment{
            {Text: apiclientgo.Pointer(req.Message)},
          },
        },
      },
    }, nil, nil)
    if err != nil {
      return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
    }

    answer := ""
    if res.ChatResponse != nil {
      answer = chatAnswer(res.ChatResponse) // helper defined in the Chat API section
    }
    return c.JSON(http.StatusOK, map[string]string{
      "response": answer,
    })
  }
}
