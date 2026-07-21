curl -X POST https://customer-be.glean.com/api/index/v1/adddatasource \
  -H 'Authorization: Bearer <token>' \
  -d '
    {
      "name": "gleantest",
      "displayName": "Glean Test",
      "datasourceCategory": "PUBLISHED_CONTENT",
      "urlRegex": "^https://bluesky.test.*",
      "objectDefinitions": [
        {
          "name": "EngineeringDoc",
          "docCategory": "PUBLISHED_CONTENT"
        }
      ],
      "isUserReferencedByEmail": true
    }'
