---
title: 'Platform Skills API is generally available'
categories: ['API', 'Feature']
---

The Platform Skills API is generally available. Skills requests do not need the `X-Glean-Include-Experimental` header.

{/* truncate */}

## What changed

- Skills endpoints are stable. Omit `X-Glean-Include-Experimental` on Skills requests.
- Operations that read or write a stored skill return `403` `insufficient_permissions` with `detail` `Skills is not enabled for this workspace.` when the caller does not have access to Skills in the workspace.
- `POST /api/skills/validation` checks a bundle without reading or writing stored skills, and it does not apply that workspace check.
- GitHub import, sync, and source preview keep their own permission details. See the [Skills API overview](/api/platform-api/skills-overview).

Triggers remain experimental and still require `X-Glean-Include-Experimental: true`.

## Documentation

- [Skills API overview](/api/platform-api/skills-overview)
- [List skills](/api/platform-api/platform-skills-list)
