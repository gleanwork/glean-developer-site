---
title: 'New Features for Tools and Agents API, API Clients, MCP'
categories: ['API']
---

Tools and agents APIs added list and call endpoints, API clients and MCP added support, and search request-body handling was corrected.

{/* truncate */}

## Action Required

- Update request body handling before upgrading.

## Changes

- Added `GET /tools/list` and `POST /tools/call` to the Client REST API.
- Added API client support for `GET /tools/list` and `POST /tools/call`.
- Added MCP server configuration support for VS Code.
- Fixed the OpenAPI request body schema for `/rest/api/v1/search`, `/rest/api/v1/recommendations`, and `/rest/api/v1/adminsearch`.

## Breaking Changes

- Python API client search method parameters changed to align with other API methods because the OpenAPI request body is now marked as required.
