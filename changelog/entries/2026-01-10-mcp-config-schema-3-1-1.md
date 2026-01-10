---
title: 'mcp-config-schema v3.1.1'
categories: ['MCP']
---

Clients without a configPath now receive null from buildCommand, preventing errors in protocol-level command construction. - Fixed buildCommand to return null for clients lacking configPath - Ensures protocol-level stability for clients with missing configuration - Committer: Steve Calvert

{/* truncate */}

Full release notes: https://github.com/gleanwork/mcp-config-schema/releases/tag/v3.1.1
