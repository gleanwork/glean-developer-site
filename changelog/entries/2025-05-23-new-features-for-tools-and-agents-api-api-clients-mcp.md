---
title: "New Features for Tools and Agents API, API Clients, MCP"
categories: ["API"]
---

- New Features:
  - Client REST API
  - New endpoint: `GET /tools/list`
  - New endpoint: `POST /tools/call`
  - API Clients - Added support for the new `GET /tools/list` and `POST /tools/call` endpoints
  - MCP Server - Support for configuring MCP server with VS Code

{/* truncate */}

- Bug Fixes:
  - Update the OpenAPI Spec to properly mark the request body as a required field. This change more
    accurately reflects how the API handles the case when the request body is not
    provided. This affects the following API endpoints: - `/rest/api/v1/search` - `/rest/api/v1/recommendations` - `rest/api/v1/adminsearch`
- Breaking Changes: - Python API client: the request body OpenAPI spec change resulted in a
  breaking change due to language semantics. This aligns search method
  parameters with other methods in the API. 