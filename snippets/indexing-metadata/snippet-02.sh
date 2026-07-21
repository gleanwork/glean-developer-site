curl -X PUT https://customer-be.glean.com/rest/api/index/document/gdrive_abc123/custom-metadata/compliance \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "customMetadata": [
      { "name": "status", "value": "Approved" },
      { "name": "reviewDate", "value": "2026-03-15" },
      { "name": "tags", "value": ["SOC2", "annual-review"] }
    ]
  }'
