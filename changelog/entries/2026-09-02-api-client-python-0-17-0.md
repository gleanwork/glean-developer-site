---
title: 'api-client-python v0.17.0'
categories: ['API Clients']
---

Api-client-python v0.17.0 includes 2 breaking removals.

{/* truncate */}

## Action Required

- Update callers of `chat.create()` to stop using `request.stream`.
- Update callers of `chat.create()` to stop using `response.status[200].content[text/event-stream`.

## Changes

- This release only includes breaking or deprecated changes.

## Breaking Changes

- Removed `request.stream` from `chat.create()`.
- Removed `response.status[200].content[text/event-stream` from `chat.create()`.

## Source

- [Release notes](https://github.com/gleanwork/api-client-python/releases/tag/v0.17.0)
