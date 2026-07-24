---
title: 'api-client-typescript v0.18.0'
categories: ['API Clients']
---

Api-client-typescript v0.18.0 includes 6 additions, 3 changes.

{/* truncate */}

## Changes

- Added `request.chatRequest.messages[].fragments[].action.metadata.actionTypeSource` to `client.chat.create()`.
- Added `response.messages[].fragments[].action.metadata.actionTypeSource` to `client.chat.create()`.
- Added `response.chatResult.chat.messages[].fragments[].action.metadata.actionTypeSource` to `client.chat.retrieve()`.
- Added `request.chatRequest.messages[].fragments[].action.metadata.actionTypeSource` to `client.chat.createstream()`.
- Added `response.workflow.webhookUrl` to `client.agents.create()`.
- Added `response.results[].primaryEntry.workflow.workflow.webhookUrl` to `client.search.retrievefeed()`.
- Changed `request` on `client.governance.data.findings.create()`.
- Changed `response` on `client.governance.data.findings.create()`.
- Changed `response.exports[]` on `client.governance.data.findings.list()`.

## Source

- [Release notes](https://github.com/gleanwork/api-client-typescript/releases/tag/v0.18.0)
