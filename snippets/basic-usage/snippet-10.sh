curl -X POST https://your-instance-be.glean.com/rest/api/v1/search \
  -H 'Authorization: Bearer <your_token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "project planning",
    "pageSize": 10,
    "requestOptions": {
      "facetBucketSize": 100
    }
  }'
