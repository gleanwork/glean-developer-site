curl -X POST https://your-instance-be.glean.com/rest/api/v1/chat \
  -H 'Authorization: Bearer <your_token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "stream": true,
    "messages": [
      {
        "author": "USER",
        "fragments": [{ "text": "Explain our Q4 strategy" }]
      }
    ]
  }'
