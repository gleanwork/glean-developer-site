curl -X POST https://<instance>-be.glean.com/rest/api/v1/search \
  -H 'Authorization: Bearer <USER_TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{"query": "test", "pageSize": 1}'
