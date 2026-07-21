curl -X POST https://<instance>-be.glean.com/api/index/v1/getdatasourceconfig \
  -H 'Authorization: Bearer <YOUR_INDEXING_TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{
    "datasource": "my-datasource"
  }'
