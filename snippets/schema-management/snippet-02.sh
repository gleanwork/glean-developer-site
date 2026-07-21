curl -X PUT https://customer-be.glean.com/rest/api/index/custom-metadata/schema/compliance \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "metadataKeys": [
      { "name": "status", "propertyType": "PICKLIST" },
      { "name": "tags", "propertyType": "MULTIPICKLIST" },
      { "name": "reviewDate", "propertyType": "TEXT" },
      { "name": "internalNotes", "propertyType": "TEXT", "skipIndexing": true }
    ]
  }'
