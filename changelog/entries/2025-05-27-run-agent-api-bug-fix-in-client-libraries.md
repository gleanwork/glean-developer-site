---
title: 'Run agent API bug fix in client libraries'
categories: ['API']
---

We fixed a bug that caused Run Agent Wait for Output (`/agents/run/wait`) to return empty responses when used with the API Client libraries.

{/* truncate */}

## Changes

- We fixed a bug that caused Run Agent Wait for Output (`/agents/run/wait`) to return empty responses when used with the API Client libraries.
- We also fixed a bug that produced non-SSE compliant output when using the Run Agent Stream Output (`/agents/run/stream`) endpoint.
