curl -X POST https://customer-be.glean.com/api/index/v1/checkdocumentaccess
  -H 'Authorization : Bearer <token>' \
  -H 'Content-Type : application/json' \
  -d '{
        "datasource": "gleantest",
        "objectType": "Article",
        "docId": "art123",
        "userEmail": "user1@example.com"
      }'
