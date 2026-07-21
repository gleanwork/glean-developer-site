curl -X POST https://<instance>-be.glean.com/rest/api/v1/search \
  -H 'Authorization: Bearer <GLOBAL_TOKEN>' \
  -H 'X-Glean-ActAs: your-email@company.com' \
  -H 'Content-Type: application/json' \
  -d '{"query": "test", "pageSize": 1}'
