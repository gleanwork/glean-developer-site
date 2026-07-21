curl -X POST https://<instance>-be.glean.com/rest/api/v1/search \
  -H 'Authorization: Bearer <OAUTH_TOKEN>' \
  -H 'X-Glean-Auth-Type: OAUTH' \
  -H 'Content-Type: application/json' \
  -d '{"query": "test", "pageSize": 1}'
