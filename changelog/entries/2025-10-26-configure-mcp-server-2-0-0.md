---
title: "configure-mcp-server v2.0.0"
categories: ["MCP"]
tags: ["Breaking", "Documentation"]
repo: "configure-mcp-server"
version: "v2.0.0"
release_url: "https://github.com/gleanwork/configure-mcp-server/releases/tag/v2.0.0"
date: "2025-10-26"
---
Version 2.0.0 introduces a breaking CLI refactor replacing meow with commander.js to enable better subcommand support. Documentation has been updated, including README and init help text, to reflect the new behavior and outputs.

Highlights
- Breaking: CLI migrated from meow to commander.js for improved subcommand handling
- Docs: Updated README and init help to match current behavior

Breaking Changes
- Refactor CLI to use commander.js instead of meow, improving subcommand support (#39).

Documentation
- Update README for accuracy (#38).
- Refresh init help to reflect current Claude output (#22).

Notes
- Users may need to adjust CLI invocations due to the switch to commander.js.

Release: https://github.com/gleanwork/configure-mcp-server/releases/tag/v2.0.0
