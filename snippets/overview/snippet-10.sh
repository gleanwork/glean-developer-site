curl -X POST https://customer-be.glean.com/api/index/v1/adddatasource \
  -H 'Authorization: Bearer <your_indexing_token>' \
  -d '{
    "name": "internal-docs",
    "displayName": "Internal Documentation",
    "datasourceCategory": "PUBLISHED_CONTENT",
    "urlRegex": "^https://internal.company.com/docs.*",
    "isUserReferencedByEmail": true
  }'
