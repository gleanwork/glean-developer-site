---
title: 'Custom Metadata API is Generally Available'
categories: ['API']
tags: ['Indexing API', 'Feature']
---

The Custom Metadata API is now generally available — a new capability for attaching structured metadata to documents from any datasource, including native connectors and custom datasources, without re-indexing the source document.

{/* truncate */}

## What's new

- **New endpoints** under `/rest/api/index`:
  - `PUT /custom-metadata/schema/{groupName}` — create or update a metadata group schema
  - `GET /custom-metadata/schema/{groupName}` — retrieve a metadata group schema
  - `DELETE /custom-metadata/schema/{groupName}` — remove a metadata group schema
  - `PUT /document/{docId}/custom-metadata/{groupName}` — add or update metadata on a document
  - `DELETE /document/{docId}/custom-metadata/{groupName}` — remove metadata from a document
- **Property types**: `TEXT`, `PICKLIST`, `TEXTLIST`, `MULTIPICKLIST`, with optional `skipIndexing` to keep values retrievable but excluded from full-text search.
- **Scoped tokens** — manage permissions per metadata group via `custommetadata:<group_name>`, or globally with `custommetadata:global_scope`.
- **Querying** — values are searchable as facets (`<groupName><keyName>:<value>`) and retrievable through the Client API `getDocuments` endpoint with `includeFields: ["CUSTOM_METADATA"]`.

## When to use it

Custom Metadata works with any document already indexed in Glean. Use it to enrich documents from native connectors (Google Drive, Confluence, Jira, etc.) or custom datasources without re-uploading them. For a side-by-side comparison with Custom Properties (which require re-indexing the document), see [Custom Properties vs Custom Metadata](/api-info/indexing/custom-metadata/custom-properties-vs-custom-metadata).

## Documentation

- [Custom Metadata Overview](/api-info/indexing/custom-metadata/overview)
- [Authentication](/api-info/indexing/custom-metadata/authentication)
- [Schema Management](/api-info/indexing/custom-metadata/schema-management)
- [Indexing Metadata](/api-info/indexing/custom-metadata/indexing-metadata)
- [Querying](/api-info/indexing/custom-metadata/querying)
