---
title: 'New Governance and Agent API Features'
categories: ['API']
---

Governance Admin API surface (10 endpoints).

{/* truncate */}

## Changes

- Governance Admin API surface (10 endpoints).
- Policies: retrieve, update, list, create, download - Reports:.
- Visibility Overrides: listVisibilityOverrides,.
- Agent API brought up to the LangChain Agent-Protocol (Agents & Runs stages).
- Retrieve an Agent `GET /agents/ {agent_id}`.
- Retrieve an Agent's Schemas `GET /agents/{agent_id}/schemas`.
- List Agents `POST /agents/search`.
- Run an Agent `POST /agents/runs/wait`.
- Run an Agent with streaming `POST /agents/runs/stream`.
- Python API client: resolved "unclosed async coroutine" warning in async transport.
- Replaced legacy alpha Run-Workflow endpoints with the standard Agent-Protocol equivalents (see above).
- Governance endpoints introduce new permission scopes (`governance.read`,.
- Python 0.4.1 uploaded to PyPI, requires 3.8+.
- TypeScript 0.4.1 published, ESM, bundled types.
- Go module path `github.com/gleaninc/glean-sdk-go/v4.1.0`.
- Java 0.4.1 available on Maven Central (`com.glean:glean-sdk:0.4.1`).
