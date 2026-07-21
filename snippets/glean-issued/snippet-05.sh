curl -X POST https://instance-be.glean.com/rest/api/v1/search \
  -H 'Authorization: Bearer <USER_TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "quarterly reports",
    "pageSize": 10
  }'
