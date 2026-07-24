---
title: 'api-client-python v0.15.4'
categories: ['API Clients']
---

Api-client-python v0.15.4 includes 6 additions, 3 changes.

{/* truncate */}

## Changes

- Added `request.messages[].fragments[].action.metadata.action_type_source` to `client.chat.create()`.
- Added `response.messages[].fragments[].action.metadata.action_type_source` to `client.chat.create()`.
- Added `response.chat_result.chat.messages[].fragments[].action.metadata.action_type_source` to `client.chat.retrieve()`.
- Added `request.messages[].fragments[].action.metadata.action_type_source` to `client.chat.create_stream()`.
- Added `response.workflow.webhook_url` to `client.agents.create()`.
- Added `response.results[].primary_entry.workflow.workflow.webhook_url` to `client.search.retrieve_feed()`.
- Changed `request` on `client.governance.data.findings.create()`.
- Changed `response` on `client.governance.data.findings.create()`.
- Changed `response.exports[]` on `client.governance.data.findings.list()`.

## Source

- [Release notes](https://github.com/gleanwork/api-client-python/releases/tag/v0.15.4)
