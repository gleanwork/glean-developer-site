---
title: "mcp-config-schema v0.14.0"
categories: ["MCP"]
tags: ["Breaking", "Documentation"]
repo: "mcp-config-schema"
version: "v0.14.0"
release_url: "https://github.com/gleanwork/mcp-config-schema/releases/tag/v0.14.0"
date: "2025-10-25"
---
Release 0.14.0 moves zod to peerDependencies, enabling compatibility with both zod v3 and v4. This is a breaking change that may require consumers to explicitly declare a compatible zod version. Documentation links for supported hosts were also refreshed.

Highlights
- Breaking: zod moved to peerDependencies to support v3 and v4
- Docs: Updated links for supported hosts

Breaking Changes
- Move zod to peerDependencies to support v3 and v4 (#41)

Documentation
- Update documentation links for supported hosts (#52)

Release: https://github.com/gleanwork/mcp-config-schema/releases/tag/v0.14.0