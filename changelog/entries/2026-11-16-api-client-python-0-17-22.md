---
title: 'api-client-python v0.17.22'
categories: ['API Clients']
---

Api-client-python v0.17.22 includes 4 breaking removals, 2 changes.

{/* truncate */}

## Action Required

- Update callers of `chat.create()` to stop using `request.text`.
- Update callers of `chat.create()` to stop using `response.output[].content[].structured_output`.
- Update callers of `chat.create_stream()` to stop using `request.text`.
- Update callers of `chat.create_stream()` to stop using `response.[].union(RESPONSE_COMPLETED).data.response.output[].content[].structured_output`.

## Changes

- Changed `response.results[].reason` on `triggers.search_events()`.
- Changed `response.results[].reason` on `triggers.search_preset_events()`.

## Breaking Changes

- Removed `request.text` from `chat.create()`.
- Removed `response.output[].content[].structured_output` from `chat.create()`.
- Removed `request.text` from `chat.create_stream()`.
- Removed `response.[].union(RESPONSE_COMPLETED).data.response.output[].content[].structured_output` from `chat.create_stream()`.

## Source

- [Release notes](https://github.com/gleanwork/api-client-python/releases/tag/v0.17.22)
