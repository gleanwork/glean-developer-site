curl -X POST https://instance-be.glean.com/api/index/v1/adddatasource \
  -H 'Authorization: Bearer <INDEXING_TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{
    "datasource": {
      "name": "My Custom Datasource",
      "displayName": "Custom Data Source",
      "homeUrl": "https://example.com"
    }
  }'
