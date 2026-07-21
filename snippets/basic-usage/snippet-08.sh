curl -X POST https://your-instance-be.glean.com/rest/api/v1/chat \
  -H 'Authorization: Bearer <your_token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "messages": [
      {
        "author": "USER",
        "fragments": [
          { "text": "What are the steps for setting up a new employee'\''s laptop?" }
        ]
      }
    ]
  }'
