---
title: 'api-client-java v0.17.0'
categories: ['API Clients']
---

Api-client-java v0.17.0 includes 1 breaking removal, 1 change.

{/* truncate */}

## Action Required

- Update callers of `chat.create()` to stop using `response.status[200].content[text/event-stream`.

## Changes

- Changed `request.stream` on `chat.create()`.

## Breaking Changes

- Removed `response.status[200].content[text/event-stream` from `chat.create()`.

## Source

- [Release notes](https://github.com/gleanwork/api-client-java/releases/tag/v0.17.0)
