---
title: 'api-client-python v0.16.1'
categories: ['API Clients']
---

Api-client-python v0.16.1 includes 2 additions, 4 changes.

{/* truncate */}

## Changes

- Added `error.authentication_suggestions[].request_type.enum(sandbox_egress)` to `client.agents.run_stream()`.
- Added `error.authentication_suggestions[].request_type.enum(sandbox_egress)` to `client.agents.run()`.
- Changed `request.messages[].fragments[]` on `client.chat.create()`.
- Changed `response.messages[].fragments[]` on `client.chat.create()`.
- Changed `response.chat_result.chat.messages[].fragments[]` on `client.chat.retrieve()`.
- Changed `request.messages[].fragments[]` on `client.chat.create_stream()`.

## Source

- [Release notes](https://github.com/gleanwork/api-client-python/releases/tag/v0.16.1)
