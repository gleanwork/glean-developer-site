# First message
curl -X POST https://your-instance-be.glean.com/rest/api/v1/chat \
  -H 'Authorization: Bearer <your_token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "messages": [
      {
        "author": "USER",
        "fragments": [{ "text": "What are our company'\''s main products?" }]
      }
    ]
  }'

# Follow-up using chatId
curl -X POST https://your-instance-be.glean.com/rest/api/v1/chat \
  -H 'Authorization: Bearer <your_token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "chatId": "chat_abc123",
    "messages": [
      {
        "author": "USER", 
        "fragments": [{ "text": "What are our company'\''s main products?" }]
      },
      {
        "author": "GLEAN_AI",
        "fragments": [{ "text": "Our main products include..." }]
      },
      {
        "author": "USER",
        "fragments": [{ "text": "Which one generates the most revenue?" }]
      }
    ]
  }'
