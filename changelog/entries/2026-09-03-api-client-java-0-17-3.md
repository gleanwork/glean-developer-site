---
title: 'api-client-java v0.17.3'
categories: ['API Clients']
---

Api-client-java v0.17.3 includes 54 additions.

{/* truncate */}

## Changes

- Added `request.createAnnouncementRequest.body.structuredList[].document.metadata.author.relatedDocuments[].results[].structuredResults[].answer.collections[].items[].shortcut.favoriteInfo.ugcType.enum(skillsType)` to `client.announcements.create()`.
- Added `response.body.structuredList[].document.metadata.author.relatedDocuments[].results[].structuredResults[].answer.collections[].items[].shortcut.favoriteInfo.ugcType.enum(skillsType)` to `client.announcements.create()`.
- Added `request.updateAnnouncementRequest.body.structuredList[].document.metadata.author.relatedDocuments[].results[].structuredResults[].answer.collections[].items[].shortcut.favoriteInfo.ugcType.enum(skillsType)` to `client.announcements.update()`.
- Added `response.body.structuredList[].document.metadata.author.relatedDocuments[].results[].structuredResults[].answer.collections[].items[].shortcut.favoriteInfo.ugcType.enum(skillsType)` to `client.announcements.update()`.
- Added `request.createAnswerRequest.data.addedRoles[].person.relatedDocuments[].querySuggestion.ranges[].document.metadata.pins[].favoriteInfo.ugcType.enum(skillsType)` to `client.answers.create()`.
- Added `response.addedRoles[].person.relatedDocuments[].querySuggestion.ranges[].document.metadata.pins[].favoriteInfo.ugcType.enum(skillsType)` to `client.answers.create()`.
- Added `request.editAnswerRequest.addedRoles[].person.relatedDocuments[].querySuggestion.ranges[].document.metadata.pins[].favoriteInfo.ugcType.enum(skillsType)` to `client.answers.update()`.
- Added `response.addedRoles[].person.relatedDocuments[].querySuggestion.ranges[].document.metadata.pins[].favoriteInfo.ugcType.enum(skillsType)` to `client.answers.update()`.
- Added `response.answerResult.answer.addedRoles[].person.relatedDocuments[].querySuggestion.ranges[].document.metadata.pins[].favoriteInfo.ugcType.enum(skillsType)` to `client.answers.retrieve()`.
- Added `response.answerResults[].answer.addedRoles[].person.relatedDocuments[].querySuggestion.ranges[].document.metadata.pins[].favoriteInfo.ugcType.enum(skillsType)` to `client.answers.list()`.
- Added `request.chatRequest.messages[].citations[].sourceDocument.metadata.author.relatedDocuments[].results[].structuredResults[].answer.collections[].items[].shortcut.favoriteInfo.ugcType.enum(skillsType)` to `client.chat.create()`.
- Added `response.messages[].citations[].sourceDocument.metadata.author.relatedDocuments[].results[].structuredResults[].answer.collections[].items[].shortcut.favoriteInfo.ugcType.enum(skillsType)` to `client.chat.create()`.
- Added `response.chatResult.chat.createdBy.relatedDocuments[].querySuggestion.ranges[].document.metadata.pins[].favoriteInfo.ugcType.enum(skillsType)` to `client.chat.retrieve()`.
- Added `error.createdBy.relatedDocuments[].querySuggestion.ranges[].document.metadata.pins[].favoriteInfo.ugcType.enum(skillsType)` to `client.chat.retrieve()`.
- Added `response.chatResults[].chat.createdBy.relatedDocuments[].querySuggestion.ranges[].document.metadata.pins[].favoriteInfo.ugcType.enum(skillsType)` to `client.chat.list()`.
- Added `request.chatRequest.messages[].citations[].sourceDocument.metadata.author.relatedDocuments[].results[].structuredResults[].answer.collections[].items[].shortcut.favoriteInfo.ugcType.enum(skillsType)` to `client.chat.createstream()`.
- Added `response.workflow.author.relatedDocuments[].querySuggestion.ranges[].document.metadata.pins[].favoriteInfo.ugcType.enum(skillsType)` to `client.agents.create()`.
- Added `response.workflowResult.workflow.author.relatedDocuments[].querySuggestion.ranges[].document.metadata.pins[].favoriteInfo.ugcType.enum(skillsType)` to `client.agents.import()`.
- Added `response.collection.addedRoles[].person.relatedDocuments[].querySuggestion.ranges[].document.metadata.pins[].favoriteInfo.ugcType.enum(skillsType)` to `client.collections.additems()`.
- Added `request.createCollectionRequest.addedRoles[].person.relatedDocuments[].querySuggestion.ranges[].document.metadata.pins[].favoriteInfo.ugcType.enum(skillsType)` to `client.collections.create()`.
- Added `response.union(class (0)).collection.addedRoles[].person.relatedDocuments[].querySuggestion.ranges[].document.metadata.pins[].favoriteInfo.ugcType.enum(skillsType)` to `client.collections.create()`.
- Added `response.collection.addedRoles[].person.relatedDocuments[].querySuggestion.ranges[].document.metadata.pins[].favoriteInfo.ugcType.enum(skillsType)` to `client.collections.deleteitem()`.
- Added `request.editCollectionRequest.addedRoles[].person.relatedDocuments[].querySuggestion.ranges[].document.metadata.pins[].favoriteInfo.ugcType.enum(skillsType)` to `client.collections.update()`.
- Added `response.addedRoles[].person.relatedDocuments[].querySuggestion.ranges[].document.metadata.pins[].favoriteInfo.ugcType.enum(skillsType)` to `client.collections.update()`.
- Added `response.collection.addedRoles[].person.relatedDocuments[].querySuggestion.ranges[].document.metadata.pins[].favoriteInfo.ugcType.enum(skillsType)` to `client.collections.updateitem()`.
- Added `response.collection.addedRoles[].person.relatedDocuments[].querySuggestion.ranges[].document.metadata.pins[].favoriteInfo.ugcType.enum(skillsType)` to `client.collections.retrieve()`.
- Added `response.collections[].addedRoles[].person.relatedDocuments[].querySuggestion.ranges[].document.metadata.pins[].favoriteInfo.ugcType.enum(skillsType)` to `client.collections.list()`.
- Added `response.documents.Map<DocumentOrError>.union(Document).metadata.author.relatedDocuments[].results[].structuredResults[].answer.collections[].items[].shortcut.favoriteInfo.ugcType.enum(skillsType)` to `client.documents.retrieve()`.
- Added `response.documents[].metadata.author.relatedDocuments[].results[].structuredResults[].answer.collections[].items[].shortcut.favoriteInfo.ugcType.enum(skillsType)` to `client.documents.retrievebyfacets()`.
- Added `response.gleanAssist.activityInsights[].user.relatedDocuments[].querySuggestion.ranges[].document.metadata.pins[].favoriteInfo.ugcType.enum(skillsType)` to `client.insights.retrieve()`.
- Added `response.searchResponse.results[].structuredResults[].document.metadata.pins[].favoriteInfo.ugcType.enum(skillsType)` to `client.messages.retrieve()`.
- Added `response.attribution.relatedDocuments[].querySuggestion.ranges[].document.metadata.collections[].items[].shortcut.favoriteInfo.ugcType.enum(skillsType)` to `client.pins.update()`.
- Added `response.pin.attribution.relatedDocuments[].querySuggestion.ranges[].document.metadata.collections[].items[].shortcut.favoriteInfo.ugcType.enum(skillsType)` to `client.pins.retrieve()`.
- Added `response.pins[].attribution.relatedDocuments[].querySuggestion.ranges[].document.metadata.collections[].items[].shortcut.favoriteInfo.ugcType.enum(skillsType)` to `client.pins.list()`.
- Added `response.attribution.relatedDocuments[].querySuggestion.ranges[].document.metadata.collections[].items[].shortcut.favoriteInfo.ugcType.enum(skillsType)` to `client.pins.create()`.
- Added `request.searchRequest.sourceDocument.metadata.author.relatedDocuments[].results[].structuredResults[].answer.collections[].items[].shortcut.favoriteInfo.ugcType.enum(skillsType)` to `client.search.queryasadmin()`.
- Added `response.results[].structuredResults[].document.metadata.pins[].favoriteInfo.ugcType.enum(skillsType)` to `client.search.queryasadmin()`.
- Added `response.results[].document.metadata.author.relatedDocuments[].results[].structuredResults[].answer.collections[].items[].shortcut.favoriteInfo.ugcType.enum(skillsType)` to `client.search.autocomplete()`.
- Added `response.results[].primaryEntry.createdBy.relatedDocuments[].querySuggestion.ranges[].document.metadata.pins[].favoriteInfo.ugcType.enum(skillsType)` to `client.search.retrievefeed()`.
- Added `request.recommendationsRequest.sourceDocument.metadata.author.relatedDocuments[].results[].structuredResults[].answer.collections[].items[].shortcut.favoriteInfo.ugcType.enum(skillsType)` to `client.search.recommendations()`.
- Added `response.results[].structuredResults[].document.metadata.pins[].favoriteInfo.ugcType.enum(skillsType)` to `client.search.recommendations()`.
- Added `request.searchRequest.sourceDocument.metadata.author.relatedDocuments[].results[].structuredResults[].answer.collections[].items[].shortcut.favoriteInfo.ugcType.enum(skillsType)` to `client.search.query()`.
- Added `response.results[].structuredResults[].document.metadata.pins[].favoriteInfo.ugcType.enum(skillsType)` to `client.search.query()`.
- Added `response.results[].relatedDocuments[].querySuggestion.ranges[].document.metadata.pins[].favoriteInfo.ugcType.enum(skillsType)` to `client.entities.list()`.
- Added `response.results[].relatedDocuments[].querySuggestion.ranges[].document.metadata.pins[].favoriteInfo.ugcType.enum(skillsType)` to `client.entities.readpeople()`.
- Added `request.createShortcutRequest.data.addedRoles[].person.relatedDocuments[].querySuggestion.ranges[].document.metadata.pins[].favoriteInfo.ugcType.enum(skillsType)` to `client.shortcuts.create()`.
- Added `response.shortcut.addedRoles[].person.relatedDocuments[].querySuggestion.ranges[].document.metadata.pins[].favoriteInfo.ugcType.enum(skillsType)` to `client.shortcuts.create()`.
- Added `response.shortcut.addedRoles[].person.relatedDocuments[].querySuggestion.ranges[].document.metadata.pins[].favoriteInfo.ugcType.enum(skillsType)` to `client.shortcuts.retrieve()`.
- Added `response.shortcuts[].addedRoles[].person.relatedDocuments[].querySuggestion.ranges[].document.metadata.pins[].favoriteInfo.ugcType.enum(skillsType)` to `client.shortcuts.list()`.
- Added `request.updateShortcutRequest.addedRoles[].person.relatedDocuments[].querySuggestion.ranges[].document.metadata.pins[].favoriteInfo.ugcType.enum(skillsType)` to `client.shortcuts.update()`.
- Added `response.shortcut.addedRoles[].person.relatedDocuments[].querySuggestion.ranges[].document.metadata.pins[].favoriteInfo.ugcType.enum(skillsType)` to `client.shortcuts.update()`.
- Added `response.metadata.lastVerifier.relatedDocuments[].querySuggestion.ranges[].document.metadata.pins[].favoriteInfo.ugcType.enum(skillsType)` to `client.verification.addreminder()`.
- Added `response.documents[].metadata.lastVerifier.relatedDocuments[].querySuggestion.ranges[].document.metadata.pins[].favoriteInfo.ugcType.enum(skillsType)` to `client.verification.list()`.
- Added `response.metadata.lastVerifier.relatedDocuments[].querySuggestion.ranges[].document.metadata.pins[].favoriteInfo.ugcType.enum(skillsType)` to `client.verification.verify()`.

## Source

- [Release notes](https://github.com/gleanwork/api-client-java/releases/tag/v0.17.3)
