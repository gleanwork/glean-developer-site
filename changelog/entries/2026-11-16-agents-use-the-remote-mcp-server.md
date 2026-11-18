---
title: 'Agents use the Remote MCP server'
categories: ['Documentation', 'MCP']
---

The Search API pages and Choose a retrieval interface now say that agents connect to Glean through the Remote MCP server, not the REST APIs.

{/* truncate */}

## Changes

- Documentation: Rewrote [Choose a retrieval interface](/api-info/client/getting-started/choosing-a-retrieval-interface) around one rule. If an agent talks to Glean, it uses the [Remote MCP server](/guides/mcp). The REST APIs are for code that talks to Glean without an agent.
- Documentation: Added this guidance to the Search API overview and to the Platform and Client API search reference pages.
- Documentation: Added guidance for coding agents that read the docs on the search, authentication, and API client pages, and in the docs MCP server's research skill.
