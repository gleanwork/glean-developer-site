---
title: "Run agent API bug fix in client libraries"
categories: ["API"]
---

We fixed a bug that caused [Run Agent Wait for Output](../api/client-api/agents/create-and-wait-run)
(`/agents/run/wait`) to return empty responses when used with the API Client
libraries.

{/* truncate */}

We also fixed a bug that produced non-SSE compliant output when
using the [Run Agent Stream Output](../api/client-api/agents/create-and-stream-run)
(`/agents/run/stream`) endpoint. 