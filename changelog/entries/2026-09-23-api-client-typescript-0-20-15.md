---
title: 'api-client-typescript v0.20.15'
categories: ['API Clients']
---

Api-client-typescript v0.20.15 includes 4 additions, 2 changes.

{/* truncate */}

## Changes

- Added `request.platformAgentRunCreateRequest.executionMode` to `agents.createrun()`.
- Added `response.status[201]` to `agents.createrun()`.
- Added `request.text` to `chat.create()`.
- Added `response.output[].content[].structuredOutput` to `chat.create()`.
- Changed `request.feedRequest.categories[]` on `client.search.retrievefeed()`.
- Changed `response.results[]` on `client.search.retrievefeed()`.

## Source

- [Release notes](https://github.com/gleanwork/api-client-typescript/releases/tag/v0.20.15)
