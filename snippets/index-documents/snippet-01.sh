curl -X POST   https://customer-be.glean.com/api/index/v1/indexdocument \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type : application/json' \
  -d '{
        "document": {
            "datasource": "gleantest",
            "objectType": "EngineeringDoc",
            "id": "blueskytest-1",
            "title": "Getting started with Blue Sky",
            "body": {
              "mimeType": "text/plain",
              "textContent": "This doc will help you get familiar with Blue Sky API"
            },
              "permissions": {
              "allowAnonymousAccess": true
            },
            "viewURL": "https://bluesky.test/blueskytest-1"
        }
    }'
