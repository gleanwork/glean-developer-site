curl -X POST  https://customer-be.glean.com/api/index/v1/bulkindexdocuments \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type : application/json' \
  -d '
{
  "uploadId": "test-upload-id",
  "isFirstPage": true,
  "isLastPage": true,
  "forceRestartUpload": true,
  "datasource": "gleantest",
  "documents": [
    {
      "datasource": "gleantest",
      "objectType": "EngineeringDoc",
      "id": "test-doc-1",
      "title": "How to bulk index documents",
      "body": {
        "mimeType": "text/plain",
        "textContent": "This doc will help you make your first successful bulk index document request"
      },
      "permissions": {
        "allowedUsers": [
          {
            "email": "myuser@bluesky.test",
            "datasourceUserId": "myuser-datasource-id",
            "name": "My User"
          }
        ],
        "allowAllDatasourceUsersAccess": true
      },
      "viewURL": "https://www.glean.engineering.co.in/test-doc-1",
      "customProperties": [
        {
          "name": "Org",
          "value": "Infrastructure"
        }
      ]
    }
  ]
}'
