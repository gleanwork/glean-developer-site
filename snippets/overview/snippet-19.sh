# 1. Define the metadata group schema
curl -X PUT https://customer-be.glean.com/rest/api/index/custom-metadata/schema/compliance \
  -H 'Authorization: Bearer <custommetadata_token>' \
  -d '{
    "metadataKeys": [
      { "name": "status", "propertyType": "PICKLIST" },
      { "name": "tags", "propertyType": "MULTIPICKLIST" }
    ]
  }'

# 2. Attach metadata to a document (works with any datasource)
curl -X PUT https://customer-be.glean.com/rest/api/index/document/gdrive_abc123/custom-metadata/compliance \
  -H 'Authorization: Bearer <custommetadata_token>' \
  -d '{
    "customMetadata": [
      { "name": "status", "value": "Approved" },
      { "name": "tags", "value": ["SOC2", "annual-review"] }
    ]
  }'
