---
title: 'api-client-python v0.11.8'
categories: ['API Clients']
---

In glean 0.11.8, the request.chat_id parameter was removed from glean.client.chat.retrieve_files(), introducing a breaking change.

{/* truncate */}

## Changes

- This release only includes breaking or deprecated changes.

## Breaking Changes

- Breaking: request.chat_id is no longer accepted in retrieve_files() - Update any integrations that relied on this parameter to avoid errors.

## Source

- [Release notes](https://github.com/gleanwork/api-client-python/releases/tag/v0.11.8)
