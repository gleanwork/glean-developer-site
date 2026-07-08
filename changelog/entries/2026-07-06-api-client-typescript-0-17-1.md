---
title: 'api-client-typescript v0.17.1'
categories: ['API Clients']
---

Api-client-typescript v0.17.1 includes 3 additions, 55 changes.

{/* truncate */}

## Changes

- Added `error.code.enum(requestTooLarge)` to `agents.get()`.
- Added `error.code.enum(requestTooLarge)` to `agents.getschemas()`.
- Added `request.feedRequest.categories[].enum(podcast)` to `client.search.retrievefeed()`.
- Changed `error` on `agents.search()`.
- Changed `error` on `agents.createrun()`.
- Changed `error` on `search.query()`.
- Changed `request.createAnnouncementRequest.body.structuredList[].document.metadata.author.relatedDocuments[].results[]` on `client.announcements.create()`.
- Changed `response` on `client.announcements.create()`.
- Changed `request.updateAnnouncementRequest.body.structuredList[].document.metadata.author.relatedDocuments[].results[]` on `client.announcements.update()`.
- Changed `response` on `client.announcements.update()`.
- Changed `request.createAnswerRequest.data.addedRoles[].person.relatedDocuments[].querySuggestion.ranges[].document.metadata` on `client.answers.create()`.
- Changed `response.addedRoles[].person.relatedDocuments[].querySuggestion.ranges[].document.metadata` on `client.answers.create()`.
- Changed `request.editAnswerRequest.addedRoles[].person.relatedDocuments[].querySuggestion.ranges[].document.metadata` on `client.answers.update()`.
- Changed `response.addedRoles[].person.relatedDocuments[].querySuggestion.ranges[].document.metadata` on `client.answers.update()`.
- Changed `response.answerResult` on `client.answers.retrieve()`.
- Changed `response.answerResults[]` on `client.answers.list()`.
- Changed `request.chatRequest.messages[].citations[].sourceDocument.metadata.author.relatedDocuments[].results[]` on `client.chat.create()`.
- Changed `response.messages[].citations[].sourceDocument.metadata.author.relatedDocuments[].results[]` on `client.chat.create()`.
- Changed `response.chatResult.chat.createdBy.relatedDocuments[].querySuggestion.ranges[].document.metadata` on `client.chat.retrieve()`.
- Changed `response.chatResults[].chat.createdBy.relatedDocuments[].querySuggestion.ranges[].document.metadata` on `client.chat.list()`.
- Changed `request.chatRequest.messages[].citations[].sourceDocument.metadata.author.relatedDocuments[].results[]` on `client.chat.createstream()`.
- Changed `response.workflow.author.relatedDocuments[].querySuggestion.ranges[].document.metadata` on `client.agents.create()`.
- Changed `response.collection` on `client.collections.additems()`.
- Changed `request.createCollectionRequest.addedRoles[].person.relatedDocuments[].querySuggestion.ranges[].document.metadata` on `client.collections.create()`.
- Changed `response.union(class (0)).collection` on `client.collections.create()`.
- Changed `response.collection` on `client.collections.deleteitem()`.
- Changed `request.editCollectionRequest.addedRoles[].person.relatedDocuments[].querySuggestion.ranges[].document.metadata` on `client.collections.update()`.
- Changed `response` on `client.collections.update()`.
- Changed `response.collection` on `client.collections.updateitem()`.
- Changed `response.collection` on `client.collections.retrieve()`.
- Changed `response.collections[]` on `client.collections.list()`.
- Changed `response.documents.Map<DocumentOrError>.union(Document).metadata.author.relatedDocuments[].results[]` on `client.documents.retrieve()`.
- Changed `response.documents[].metadata.author.relatedDocuments[].results[]` on `client.documents.retrievebyfacets()`.
- Changed `response.gleanAssist.activityInsights[].user.relatedDocuments[].querySuggestion.ranges[].document.metadata` on `client.insights.retrieve()`.
- Changed `response.searchResponse.results[].structuredResults[].document.metadata` on `client.messages.retrieve()`.
- Changed `response` on `client.pins.update()`.
- Changed `response.pin` on `client.pins.retrieve()`.
- Changed `response.pins[]` on `client.pins.list()`.
- Changed `response` on `client.pins.create()`.
- Changed `request.searchRequest.sourceDocument.metadata.author.relatedDocuments[].results[]` on `client.search.queryasadmin()`.
- Changed `response.results[].structuredResults[].document.metadata` on `client.search.queryasadmin()`.
- Changed `response.results[].document.metadata.author.relatedDocuments[].results[]` on `client.search.autocomplete()`.
- Changed `response.results[]` on `client.search.retrievefeed()`.
- Changed `request.recommendationsRequest.sourceDocument.metadata.author.relatedDocuments[].results[]` on `client.search.recommendations()`.
- Changed `response.results[].structuredResults[].document.metadata` on `client.search.recommendations()`.
- Changed `request.searchRequest.sourceDocument.metadata.author.relatedDocuments[].results[]` on `client.search.query()`.
- Changed `response.results[].structuredResults[].document.metadata` on `client.search.query()`.
- Changed `response.results[].relatedDocuments[].querySuggestion.ranges[].document.metadata` on `client.entities.list()`.
- Changed `response.results[].relatedDocuments[].querySuggestion.ranges[].document.metadata` on `client.entities.readpeople()`.
- Changed `request.createShortcutRequest.data.addedRoles[].person.relatedDocuments[].querySuggestion.ranges[].document.metadata` on `client.shortcuts.create()`.
- Changed `response.shortcut` on `client.shortcuts.create()`.
- Changed `response.shortcut` on `client.shortcuts.retrieve()`.
- Changed `response.shortcuts[]` on `client.shortcuts.list()`.
- Changed `request.updateShortcutRequest.addedRoles[].person.relatedDocuments[].querySuggestion.ranges[].document.metadata` on `client.shortcuts.update()`.
- Changed `response.shortcut` on `client.shortcuts.update()`.
- Changed `response.metadata.lastVerifier.relatedDocuments[].querySuggestion.ranges[].document.metadata` on `client.verification.addreminder()`.
- Changed `response.documents[].metadata.lastVerifier.relatedDocuments[].querySuggestion.ranges[].document.metadata` on `client.verification.list()`.
- Changed `response.metadata.lastVerifier.relatedDocuments[].querySuggestion.ranges[].document.metadata` on `client.verification.verify()`.

## Source

- [Release notes](https://github.com/gleanwork/api-client-typescript/releases/tag/v0.17.1)
