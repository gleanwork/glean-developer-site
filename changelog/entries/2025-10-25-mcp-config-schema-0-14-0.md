---
title: "mcp-config-schema v0.14.0"
categories: ["MCP"]
tags: ["Breaking", "Documentation"]
repo: "mcp-config-schema"
version: "v0.14.0"
release_url: "https://github.com/gleanwork/mcp-config-schema/releases/tag/v0.14.0"
date: "2025-10-25"
---
This release moves zod to peerDependencies to support both v3 and v4, which may require consumers to manage zod explicitly. It also updates documentation links for supported hosts.

Highlights
- Breaking: zod moved to peerDependencies to support v3 and v4
- Docs: refreshed links for supported hosts

Breaking Changes
- refactor: Move zod to peerDependencies to support v3 and v4 (#41). Consumers must ensure a compatible zod version is installed.

Documentation
- docs: Updates documentation links for supported hosts (#52).

Notes
- Ensure your project declares a compatible zod dependency (v3 or v4) to avoid runtime/installation issues.

Release: https://github.com/gleanwork/mcp-config-schema/releases/tag/v0.14.0
