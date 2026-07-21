curl -X POST https://customer-be.glean.com/api/index/v1/indexdocument \
  -H 'Authorization: Bearer <your_indexing_token>' \
  -d '{
    "document": {
      "datasource": "internal-docs",
      "objectType": "Document",
      "id": "getting-started-guide",
      "title": "Getting Started Guide",
      "body": {
        "mimeType": "text/plain",
        "textContent": "This guide helps new employees get up to speed quickly..."
      },
      "permissions": {
        "allowAnonymousAccess": false,
        "allowedUsers": [{ "email": "employee@company.com" }]
      },
      "viewURL": "https://internal.company.com/docs/getting-started"
    }
  }'
