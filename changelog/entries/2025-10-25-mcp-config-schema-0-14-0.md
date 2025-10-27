---
title: "mcp-config-schema v0.14.0"
categories: ["MCP"]
tags: ["Breaking", "Documentation"]
repo: "mcp-config-schema"
version: "v0.14.0"
release_url: "https://github.com/gleanwork/mcp-config-schema/releases/tag/v0.14.0"
date: "2025-10-25"
---
Release 0.14.0 moves zod to peerDependencies to support both v3 and v4, which may require consumers to declare a compatible zod version explicitly. Documentation links for supported hosts were also updated.

Highlights
- BREAKING: zod moved to peerDependencies to enable v3 and v4 compatibility
- Docs: refreshed links for supported hosts

Breaking Changes
- Move zod to peerDependencies to support zod v3 and v4 (PR #41). Consumers must install a compatible zod version.

Documentation
- Update documentation links for supported hosts (PR #52).

Notes
- Ensure your project lists zod as a dependency or peer dependency and matches a supported version.

Release: https://github.com/gleanwork/mcp-config-schema/releases/tag/v0.14.0
