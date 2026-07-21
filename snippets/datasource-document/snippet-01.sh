curl -X POST https://customer-be.glean.com/api/index/v1/debug/{datasource}/document
  -H 'Authorization : Bearer <token>' \
  -H 'Content-Type : application/json' \
  -d '{
        "objectType": "Article",
        "docId": "art123"
      }'
