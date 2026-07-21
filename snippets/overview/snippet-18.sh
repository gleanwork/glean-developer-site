curl -X POST https://<instance>-be.glean.com/api/index/v1/indexdocument \
  -H 'Authorization: Bearer <YOUR_INDEXING_TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{
    "datasource": "test-datasource",
    "document": {
      "id": "test-doc-001",
      "title": "Test Document",
      "body": {
        "mimeType": "text/plain",
        "textContent": "This is a test document for authentication verification."
      },
      "updatedAt": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
    }
  }'
