curl -X POST https://<instance>-be.glean.com/rest/api/v1/search \
  -H 'Authorization: Bearer <oauth_token>' \
  -H 'X-Glean-Auth-Type: OAUTH' \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "quarterly reports",
    "pageSize": 10
  }'
