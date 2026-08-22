---
title: 'api-client-typescript v0.19.0'
categories: ['API Clients']
---

Api-client-typescript v0.19.0 includes 4 additions, 4 changes.

{/* truncate */}

## Changes

- Added `request.chatRequest.messages[].citations[].sourceSkill` to `client.chat.create()`.
- Added `response.messages[].citations[].sourceSkill` to `client.chat.create()`.
- Added `response.chatResult.chat.messages[].citations[].sourceSkill` to `client.chat.retrieve()`.
- Added `request.chatRequest.messages[].citations[].sourceSkill` to `client.chat.createstream()`.
- Changed `request.input.union(Array<PlatformChatInputMessage>)[].role` on `chat.create()`.
- Changed `response` on `chat.create()`.
- Changed `request.feedRequest.categories[]` on `client.search.retrievefeed()`.
- Changed `response.results[]` on `client.search.retrievefeed()`.

## Source

- [Release notes](https://github.com/gleanwork/api-client-typescript/releases/tag/v0.19.0)
