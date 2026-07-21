curl -X POST https://instance-be.glean.com/api/index/v1/indexdocument \
  -H 'Authorization: Bearer <INDEXING_TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{
    "datasource": "my-datasource",
    "document": {
      "id": "doc-123",
      "title": "Example Document",
      "body": {"mimeType": "text/plain", "textContent": "Document content"},
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  }'
