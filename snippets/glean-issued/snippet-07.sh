curl -X POST https://instance-be.glean.com/rest/api/v1/chat \
  -H 'Authorization: Bearer <USER_TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "What are the latest quarterly results?",
    "conversationId": "optional-conversation-id"
  }'
