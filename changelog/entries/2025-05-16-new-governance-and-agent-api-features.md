---
title: "New Governance and Agent API Features"
categories: ["API"]
---

- New Features:
  - Governance Admin API surface (10 endpoints)
  - Policies: retrieve, update, list, create, download - Reports:
    createReport, downloadReport, status
  - Visibility Overrides: listVisibilityOverrides,
    createVisibilityOverride
  - Agent API brought up to the LangChain Agent-Protocol (Agents & Runs stages)
  - Retrieve an Agent `GET /agents/ {agent_id}`

{/* truncate */}

- Retrieve an Agent's Schemas `GET /agents/{agent_id}/schemas`
  - List Agents `POST /agents/search`
  - Run an Agent `POST /agents/runs/wait`
  - Run an Agent with streaming `POST /agents/runs/stream`
- Changes & Enhancements:
  - Replaced legacy alpha Run-Workflow endpoints with the standard Agent-Protocol equivalents (see above).
- Breaking Changes:
  - Governance endpoints introduce new permission scopes (`governance.read`,
    `governance.write`).
- Bug Fixes:
  - Python API client: resolved "unclosed async coroutine" warning in async transport.
  - Language-Specific Notes:
    - Python 0.4.1 uploaded to PyPI, requires 3.8+.
    - TypeScript 0.4.1 published, ESM, bundled types.
    - Go module path `github.com/gleaninc/glean-sdk-go/v4.1.0`.
    - Java 0.4.1 available on Maven Central (`com.glean:glean-sdk:0.4.1`). 