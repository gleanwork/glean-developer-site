---
title: "mcp-config-schema v0.2.0"
categories: ["MCP"]
tags: ["Feature","Enhancement","Bug Fix","Documentation"]
repo: "mcp-config-schema"
version: "v0.2.0"
release_url: "https://github.com/gleanwork/mcp-config-schema/releases/tag/v0.2.0"
date: "2025-10-20"
---
This release adds environment-specific overrides and nested tool schema validation, making MCP configurations more flexible and reliable. It also improves error messages, relaxes some version constraints, and fixes relative $defs resolution, with clearer docs for multi-server setups.

- Environment-specific overrides in MCP config
- Schema validation for nested tool definitions
- Fix for relative $defs reference resolution

Features
- Add support for environment-specific overrides in MCP config.
- Introduce schema validation for nested tool definitions.

Enhancements
- Improve error messages for invalid enum values.
- Relax version constraints for optional fields.

Bug Fixes
- Fix resolution of relative refs in $defs.

Documentation
- Clarify examples for multi-server setups.

Release: https://github.com/gleanwork/mcp-config-schema/releases/tag/v0.2.0
