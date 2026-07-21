curl -X POST https://your-instance-be.glean.com/api/agents/search \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -H "X-Glean-Include-Experimental: true" \
  -d '{ "name": "HR Policy Agent" }'
