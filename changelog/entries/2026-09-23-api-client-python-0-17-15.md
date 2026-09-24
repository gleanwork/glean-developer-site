---
title: 'api-client-python v0.17.15'
categories: ['API Clients']
---

Api-client-python v0.17.15 includes 4 additions, 2 changes.

{/* truncate */}

## Changes

- Added `request.execution_mode` to `agents.create_run()`.
- Added `response.status[201]` to `agents.create_run()`.
- Added `request.text` to `chat.create()`.
- Added `response.output[].content[].structured_output` to `chat.create()`.
- Changed `request.categories[]` on `client.search.retrieve_feed()`.
- Changed `response.results[]` on `client.search.retrieve_feed()`.

## Source

- [Release notes](https://github.com/gleanwork/api-client-python/releases/tag/v0.17.15)
