---
title: 'api-client-typescript v0.16.0'
categories: ['API Clients']
---

Api-client-typescript v0.16.0 includes 57 additions, 1 change.

{/* truncate */}

## Changes

- Added `request.createAnnouncementRequest.body.structuredList[].document.metadata.author.relatedDocuments[].results[].structuredResults[].customEntity.roles[].group.type.enum(collectionAudience)` to `client.announcements.create()`.
- Added `response.body.structuredList[].document.metadata.author.relatedDocuments[].results[].structuredResults[].customEntity.roles[].group.type.enum(collectionAudience)` to `client.announcements.create()`.
- Added `request.updateAnnouncementRequest.body.structuredList[].document.metadata.author.relatedDocuments[].results[].structuredResults[].customEntity.roles[].group.type.enum(collectionAudience)` to `client.announcements.update()`.
- Added `response.body.structuredList[].document.metadata.author.relatedDocuments[].results[].structuredResults[].customEntity.roles[].group.type.enum(collectionAudience)` to `client.announcements.update()`.
- Added `request.createAnswerRequest.data.addedRoles[].group.type.enum(collectionAudience)` to `client.answers.create()`.
- Added `response.addedRoles[].group.type.enum(collectionAudience)` to `client.answers.create()`.
- Added `request.editAnswerRequest.addedRoles[].group.type.enum(collectionAudience)` to `client.answers.update()`.
- Added `response.addedRoles[].group.type.enum(collectionAudience)` to `client.answers.update()`.
- Added `response.answerResult.answer.addedRoles[].group.type.enum(collectionAudience)` to `client.answers.retrieve()`.
- Added `response.answerResults[].answer.addedRoles[].group.type.enum(collectionAudience)` to `client.answers.list()`.
- Added `request.chatRequest.messages[].citations[].sourceDocument.metadata.author.relatedDocuments[].results[].structuredResults[].customEntity.roles[].group.type.enum(collectionAudience)` to `client.chat.create()`.
- Added `response.messages[].citations[].sourceDocument.metadata.author.relatedDocuments[].results[].structuredResults[].customEntity.roles[].group.type.enum(collectionAudience)` to `client.chat.create()`.
- Added `response.chatResult.chat.createdBy.relatedDocuments[].querySuggestion.ranges[].document.metadata.collections[].addedRoles[].group.type.enum(collectionAudience)` to `client.chat.retrieve()`.
- Added `response.chatResults[].chat.createdBy.relatedDocuments[].querySuggestion.ranges[].document.metadata.collections[].addedRoles[].group.type.enum(collectionAudience)` to `client.chat.list()`.
- Added `request.chatRequest.messages[].citations[].sourceDocument.metadata.author.relatedDocuments[].results[].structuredResults[].customEntity.roles[].group.type.enum(collectionAudience)` to `client.chat.createstream()`.
- Added `response.collection.addedRoles[].group.type.enum(collectionAudience)` to `client.collections.additems()`.
- Added `request.createCollectionRequest.addedRoles[].group.type.enum(collectionAudience)` to `client.collections.create()`.
- Added `response.union(class (0)).collection.addedRoles[].group.type.enum(collectionAudience)` to `client.collections.create()`.
- Added `response.collection.addedRoles[].group.type.enum(collectionAudience)` to `client.collections.deleteitem()`.
- Added `request.editCollectionRequest.addedRoles[].group.type.enum(collectionAudience)` to `client.collections.update()`.
- Added `response.addedRoles[].group.type.enum(collectionAudience)` to `client.collections.update()`.
- Added `response.collection.addedRoles[].group.type.enum(collectionAudience)` to `client.collections.updateitem()`.
- Added `response.collection.addedRoles[].group.type.enum(collectionAudience)` to `client.collections.retrieve()`.
- Added `response.collections[].addedRoles[].group.type.enum(collectionAudience)` to `client.collections.list()`.
- Added `response.documents.Map<DocumentOrError>.union(Document).metadata.author.relatedDocuments[].results[].structuredResults[].customEntity.roles[].group.type.enum(collectionAudience)` to `client.documents.retrieve()`.
- Added `response.documents[].metadata.author.relatedDocuments[].results[].structuredResults[].customEntity.roles[].group.type.enum(collectionAudience)` to `client.documents.retrievebyfacets()`.
- Added `response.gleanAssist.activityInsights[].user.relatedDocuments[].querySuggestion.ranges[].document.metadata.collections[].addedRoles[].group.type.enum(collectionAudience)` to `client.insights.retrieve()`.
- Added `response.searchResponse.results[].structuredResults[].document.metadata.collections[].addedRoles[].group.type.enum(collectionAudience)` to `client.messages.retrieve()`.
- Added `response.attribution.relatedDocuments[].querySuggestion.ranges[].document.metadata.collections[].addedRoles[].group.type.enum(collectionAudience)` to `client.pins.update()`.
- Added `response.pin.attribution.relatedDocuments[].querySuggestion.ranges[].document.metadata.collections[].addedRoles[].group.type.enum(collectionAudience)` to `client.pins.retrieve()`.
- Added `response.pins[].attribution.relatedDocuments[].querySuggestion.ranges[].document.metadata.collections[].addedRoles[].group.type.enum(collectionAudience)` to `client.pins.list()`.
- Added `response.attribution.relatedDocuments[].querySuggestion.ranges[].document.metadata.collections[].addedRoles[].group.type.enum(collectionAudience)` to `client.pins.create()`.
- Added `request.searchRequest.sourceDocument.metadata.author.relatedDocuments[].results[].structuredResults[].customEntity.roles[].group.type.enum(collectionAudience)` to `client.search.queryasadmin()`.
- Added `response.results[].structuredResults[].document.metadata.collections[].addedRoles[].group.type.enum(collectionAudience)` to `client.search.queryasadmin()`.
- Added `response.results[].document.metadata.author.relatedDocuments[].results[].structuredResults[].customEntity.roles[].group.type.enum(collectionAudience)` to `client.search.autocomplete()`.
- Added `request.feedRequest.categories[].enum(cardStackPromo)` to `client.search.retrievefeed()`.
- Added `request.recommendationsRequest.sourceDocument.metadata.author.relatedDocuments[].results[].structuredResults[].customEntity.roles[].group.type.enum(collectionAudience)` to `client.search.recommendations()`.
- Added `response.results[].structuredResults[].document.metadata.collections[].addedRoles[].group.type.enum(collectionAudience)` to `client.search.recommendations()`.
- Added `request.searchRequest.sourceDocument.metadata.author.relatedDocuments[].results[].structuredResults[].customEntity.roles[].group.type.enum(collectionAudience)` to `client.search.query()`.
- Added `response.results[].structuredResults[].document.metadata.collections[].addedRoles[].group.type.enum(collectionAudience)` to `client.search.query()`.
- Added `response.results[].relatedDocuments[].querySuggestion.ranges[].document.metadata.collections[].addedRoles[].group.type.enum(collectionAudience)` to `client.entities.list()`.
- Added `response.results[].relatedDocuments[].querySuggestion.ranges[].document.metadata.collections[].addedRoles[].group.type.enum(collectionAudience)` to `client.entities.readpeople()`.
- Added `request.createShortcutRequest.data.addedRoles[].group.type.enum(collectionAudience)` to `client.shortcuts.create()`.
- Added `response.shortcut.addedRoles[].group.type.enum(collectionAudience)` to `client.shortcuts.create()`.
- Added `response.shortcut.addedRoles[].group.type.enum(collectionAudience)` to `client.shortcuts.retrieve()`.
- Added `response.shortcuts[].addedRoles[].group.type.enum(collectionAudience)` to `client.shortcuts.list()`.
- Added `request.updateShortcutRequest.addedRoles[].group.type.enum(collectionAudience)` to `client.shortcuts.update()`.
- Added `response.shortcut.addedRoles[].group.type.enum(collectionAudience)` to `client.shortcuts.update()`.
- Added `response.metadata.lastVerifier.relatedDocuments[].querySuggestion.ranges[].document.metadata.collections[].addedRoles[].group.type.enum(collectionAudience)` to `client.verification.addreminder()`.
- Added `response.documents[].metadata.lastVerifier.relatedDocuments[].querySuggestion.ranges[].document.metadata.collections[].addedRoles[].group.type.enum(collectionAudience)` to `client.verification.list()`.
- Added `response.metadata.lastVerifier.relatedDocuments[].querySuggestion.ranges[].document.metadata.collections[].addedRoles[].group.type.enum(collectionAudience)` to `client.verification.verify()`.
- Added `response.report.config.allowlistOptions.regexes` to `client.governance.data.policies.retrieve()`.
- Added `request.updateDlpReportRequest.config.allowlistOptions.regexes` to `client.governance.data.policies.update()`.
- Added `response.reports[].config.allowlistOptions.regexes` to `client.governance.data.policies.list()`.
- Added `request.config.allowlistOptions.regexes` to `client.governance.data.policies.create()`.
- Added `response.report.config.allowlistOptions.regexes` to `client.governance.data.policies.create()`.
- Added `request.config.allowlistOptions.regexes` to `client.governance.data.reports.create()`.
- Changed `response.results[]` on `client.search.retrievefeed()`.

## Source

- [Release notes](https://github.com/gleanwork/api-client-typescript/releases/tag/v0.16.0)
