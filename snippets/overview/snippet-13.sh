curl -X POST https://instance-be.glean.com/api/index/v1/bulkindexdocuments \
  -H 'Authorization: Bearer <INDEXING_TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{
    "datasource": "my-datasource",
    "documents": [
      {
        "id": "doc-1",
        "title": "First Document",
        "body": {"mimeType": "text/plain", "textContent": "Content 1"}
      },
      {
        "id": "doc-2", 
        "title": "Second Document",
        "body": {"mimeType": "text/plain", "textContent": "Content 2"}
      }
    ]
  }'
