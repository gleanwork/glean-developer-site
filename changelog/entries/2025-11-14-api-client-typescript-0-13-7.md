---
title: 'api-client-typescript v0.13.7'
categories: ['API Clients']
---

The request.getchatfilesrequest.chatId parameter was removed from glean.client.chat.retrieveFiles(), introducing a breaking change.

{/* truncate */}

## Action Required

- Review this breaking change before upgrading: Breaking change: chatId parameter is no longer accepted in retrieveFiles() - Update any integrations relying on chatId in this method.

## Changes

- This release only includes breaking or deprecated changes.

## Breaking Changes

- Breaking change: chatId parameter is no longer accepted in retrieveFiles() - Update any integrations relying on chatId in this method.

## Source

- [Release notes](https://github.com/gleanwork/api-client-typescript/releases/tag/v0.13.7)
