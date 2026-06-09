---
title: 'api-client-typescript v0.15.0'
categories: ['API Clients']
---

Api-client-typescript v0.15.0 includes 3 additions, 54 changes.

{/* truncate */}

## Changes

- Added `errorCode.enum(corruptItem)` to `client.collections.create()`.
- Added `errorCode.enum(corruptItem)` to `client.collections.delete()`.
- Added `errorCode.enum(corruptItem)` to `client.collections.update()`.
- Changed `request.chatRequest.messages[].citations[].sourceDocument.metadata.author.relatedDocuments[].results[].structuredResults[].answer` on `client.chat.create()`.
- Changed `response` on `client.chat.create()`.
- Changed `response` on `client.collections.additems()`.
- Changed `request.feedback1.category` on `client.activity.feedback()`.
- Changed `request.createAnnouncementRequest.body.structuredList[].document.metadata.author.relatedDocuments[].results[].structuredResults[].answer` on `client.announcements.create()`.
- Changed `response` on `client.announcements.create()`.
- Changed `request.updateAnnouncementRequest.body.structuredList[].document.metadata.author.relatedDocuments[].results[].structuredResults[].answer` on `client.announcements.update()`.
- Changed `response` on `client.announcements.update()`.
- Changed `request.createAnswerRequest.data.addedRoles[].person.relatedDocuments[]` on `client.answers.create()`.
- Changed `response` on `client.answers.create()`.
- Changed `request.editAnswerRequest.addedRoles[].person.relatedDocuments[]` on `client.answers.update()`.
- Changed `response` on `client.answers.update()`.
- Changed `response.answerResult.answer` on `client.answers.retrieve()`.
- Changed `response.answerResults[].answer` on `client.answers.list()`.
- Changed `response.chatResult.chat.createdBy.relatedDocuments[]` on `client.chat.retrieve()`.
- Changed `response.chatResults[].chat.createdBy.relatedDocuments[]` on `client.chat.list()`.
- Changed `request.chatRequest.messages[].citations[].sourceDocument.metadata.author.relatedDocuments[].results[].structuredResults[].answer` on `client.chat.createstream()`.
- Changed `request.createCollectionRequest.addedRoles[].person.relatedDocuments[]` on `client.collections.create()`.
- Changed `response.union(class (0))` on `client.collections.create()`.
- Changed `response.collection` on `client.collections.deleteitem()`.
- Changed `request.editCollectionRequest.addedRoles[].person.relatedDocuments[]` on `client.collections.update()`.
- Changed `response` on `client.collections.update()`.
- Changed `response.collection` on `client.collections.updateitem()`.
- Changed `response` on `client.collections.retrieve()`.
- Changed `response.collections[]` on `client.collections.list()`.
- Changed `response.documents.Map<DocumentOrError>.union(Document).metadata.author.relatedDocuments[].results[].structuredResults[].answer` on `client.documents.retrieve()`.
- Changed `response.documents[].metadata.author.relatedDocuments[].results[].structuredResults[].answer` on `client.documents.retrievebyfacets()`.
- Changed `request.insightsRequest` on `client.insights.retrieve()`.
- Changed `response` on `client.insights.retrieve()`.
- Changed `response.searchResponse.results[].structuredResults[]` on `client.messages.retrieve()`.
- Changed `response.attribution.relatedDocuments[]` on `client.pins.update()`.
- Changed `response.pin.attribution.relatedDocuments[]` on `client.pins.retrieve()`.
- Changed `response.pins[].attribution.relatedDocuments[]` on `client.pins.list()`.
- Changed `response.attribution.relatedDocuments[]` on `client.pins.create()`.
- Changed `request.searchRequest.sourceDocument.metadata.author.relatedDocuments[].results[].structuredResults[].answer` on `client.search.queryasadmin()`.
- Changed `response.results[].structuredResults[]` on `client.search.queryasadmin()`.
- Changed `response.results[].document.metadata.author.relatedDocuments[].results[].structuredResults[].answer` on `client.search.autocomplete()`.
- Changed `request.feedRequest.categories[]` on `client.search.retrievefeed()`.
- Changed `response.results[]` on `client.search.retrievefeed()`.
- Changed `request.recommendationsRequest.sourceDocument.metadata.author.relatedDocuments[].results[].structuredResults[].answer` on `client.search.recommendations()`.
- Changed `response.results[].structuredResults[]` on `client.search.recommendations()`.
- Changed `request.searchRequest.sourceDocument.metadata.author.relatedDocuments[].results[].structuredResults[].answer` on `client.search.query()`.
- Changed `response.results[].structuredResults[]` on `client.search.query()`.
- Changed `response.results[].relatedDocuments[]` on `client.entities.list()`.
- Changed `response.results[].relatedDocuments[]` on `client.entities.readpeople()`.
- Changed `request.createShortcutRequest.data.addedRoles[].person.relatedDocuments[]` on `client.shortcuts.create()`.
- Changed `response.shortcut.addedRoles[].person.relatedDocuments[]` on `client.shortcuts.create()`.
- Changed `response.shortcut.addedRoles[].person.relatedDocuments[]` on `client.shortcuts.retrieve()`.
- Changed `response.shortcuts[].addedRoles[].person.relatedDocuments[]` on `client.shortcuts.list()`.
- Changed `request.updateShortcutRequest.addedRoles[].person.relatedDocuments[]` on `client.shortcuts.update()`.
- Changed `response.shortcut.addedRoles[].person.relatedDocuments[]` on `client.shortcuts.update()`.
- Changed `response.metadata.lastVerifier.relatedDocuments[]` on `client.verification.addreminder()`.
- Changed `response.documents[].metadata.lastVerifier.relatedDocuments[]` on `client.verification.list()`.
- Changed `response.metadata.lastVerifier.relatedDocuments[]` on `client.verification.verify()`.

## Source

- [Release notes](https://github.com/gleanwork/api-client-typescript/releases/tag/v0.15.0)
