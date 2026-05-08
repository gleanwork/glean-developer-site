---
title: 'api-client-java v0.12.9'
categories: ['API Clients']
---

Api-client-java v0.12.9 includes 6 additions, 51 changes.

{/* truncate */}

## Changes

- Added `response.report.config.sensitiveContentOptions.customSensitiveExpressions` to `client.governance.data.policies.retrieve()`.
- Added `request.updatedlpreportrequest.config.sensitiveContentOptions.customSensitiveExpressions` to `client.governance.data.policies.update()`.
- Added `response.reports.[].config.sensitiveContentOptions.customSensitiveExpressions` to `client.governance.data.policies.list()`.
- Added `request.config.sensitiveContentOptions.customSensitiveExpressions` to `client.governance.data.policies.create()`.
- Added `response.report.config.sensitiveContentOptions.customSensitiveExpressions` to `client.governance.data.policies.create()`.
- Added `request.config.sensitiveContentOptions.customSensitiveExpressions` to `client.governance.data.reports.create()`.
- Changed `request.body.structuredList.[].document.metadata.author` on `client.announcements.create()`.
- Changed `response.body.structuredList.[].document.metadata.author` on `client.announcements.create()`.
- Changed `request.body.structuredList.[].document.metadata.author` on `client.announcements.update()`.
- Changed `response.body.structuredList.[].document.metadata.author` on `client.announcements.update()`.
- Changed `request.data.addedRoles.[].person` on `client.answers.create()`.
- Changed `response.addedroles.[].person` on `client.answers.create()`.
- Changed `request.addedRoles.[].person` on `client.answers.update()`.
- Changed `response.addedroles.[].person` on `client.answers.update()`.
- Changed `response.answerresult.answer.addedRoles.[].person` on `client.answers.retrieve()`.
- Changed `response.answerresults.[].answer.addedRoles.[].person` on `client.answers.list()`.
- Changed `request.chatrequest.messages.[].citations.[].sourceDocument.metadata.author` on `client.chat.create()`.
- Changed `response.messages.[].citations.[].sourceDocument.metadata.author` on `client.chat.create()`.
- Changed `response.chatresult.chat.createdBy` on `client.chat.retrieve()`.
- Changed `response.chatresults.[].chat.createdBy` on `client.chat.list()`.
- Changed `request.chatrequest.messages.[].citations.[].sourceDocument.metadata.author` on `client.chat.createstream()`.
- Changed `response.collection.addedRoles.[].person` on `client.collections.additems()`.
- Changed `request.addedRoles.[].person` on `client.collections.create()`.
- Changed `response.[class].collection.addedRoles.[].person` on `client.collections.create()`.
- Changed `response.collection.addedRoles.[].person` on `client.collections.deleteitem()`.
- Changed `request.addedRoles.[].person` on `client.collections.update()`.
- Changed `response.addedroles.[].person` on `client.collections.update()`.
- Changed `response.collection.addedRoles.[].person` on `client.collections.updateitem()`.
- Changed `response.collection.addedRoles.[].person` on `client.collections.retrieve()`.
- Changed `response.collections.[].addedRoles.[].person` on `client.collections.list()`.
- Changed `response.documents.{}.[document].metadata.author` on `client.documents.retrieve()`.
- Changed `response.documents.[].metadata.author` on `client.documents.retrievebyfacets()`.
- Changed `response` on `client.insights.retrieve()`.
- Changed `response.searchresponse.results.[].structuredResults.[].document.metadata.author` on `client.messages.retrieve()`.
- Changed `response.attribution` on `client.pins.update()`.
- Changed `response.pin.attribution` on `client.pins.retrieve()`.
- Changed `response.pins.[].attribution` on `client.pins.list()`.
- Changed `response.attribution` on `client.pins.create()`.
- Changed `request.sourceDocument.metadata.author` on `client.search.queryasadmin()`.
- Changed `response.results.[].structuredResults.[].document.metadata.author` on `client.search.queryasadmin()`.
- Changed `response.results.[].document.metadata.author` on `client.search.autocomplete()`.
- Changed `response.results.[].primaryEntry.createdBy` on `client.search.retrievefeed()`.
- Changed `request.sourceDocument.metadata.author` on `client.search.recommendations()`.
- Changed `response.results.[].structuredResults.[].document.metadata.author` on `client.search.recommendations()`.
- Changed `request.sourceDocument.metadata.author` on `client.search.query()`.
- Changed `response.results.[].structuredResults.[].document.metadata.author` on `client.search.query()`.
- Changed `response.results.[]` on `client.entities.list()`.
- Changed `response.results.[]` on `client.entities.readpeople()`.
- Changed `request.data.addedRoles.[].person` on `client.shortcuts.create()`.
- Changed `response.shortcut.addedRoles.[].person` on `client.shortcuts.create()`.
- Changed `response.shortcut.addedRoles.[].person` on `client.shortcuts.retrieve()`.
- Changed `response.shortcuts.[].addedRoles.[].person` on `client.shortcuts.list()`.
- Changed `request.addedRoles.[].person` on `client.shortcuts.update()`.
- Changed `response.shortcut.addedRoles.[].person` on `client.shortcuts.update()`.
- Changed `response.metadata.lastVerifier` on `client.verification.addreminder()`.
- Changed `response.documents.[].metadata.lastVerifier` on `client.verification.list()`.
- Changed `response.metadata.lastVerifier` on `client.verification.verify()`.

## Source

- [Release notes](https://github.com/gleanwork/api-client-java/releases/tag/v0.12.9)
