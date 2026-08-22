---
title: 'api-client-python v0.16.0'
categories: ['API Clients']
---

Api-client-python v0.16.0 includes 4 additions, 4 changes.

{/* truncate */}

## Changes

- Added `request.messages[].citations[].source_skill` to `client.chat.create()`.
- Added `response.messages[].citations[].source_skill` to `client.chat.create()`.
- Added `response.chat_result.chat.messages[].citations[].source_skill` to `client.chat.retrieve()`.
- Added `request.messages[].citations[].source_skill` to `client.chat.create_stream()`.
- Changed `request.input.union(Array<PlatformChatInputMessage>)[].role` on `chat.create()`.
- Changed `response` on `chat.create()`.
- Changed `request.categories[]` on `client.search.retrieve_feed()`.
- Changed `response.results[]` on `client.search.retrieve_feed()`.

## Source

- [Release notes](https://github.com/gleanwork/api-client-python/releases/tag/v0.16.0)
