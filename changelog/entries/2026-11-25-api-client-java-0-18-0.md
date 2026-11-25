---
title: 'api-client-java v0.18.0'
categories: ['API Clients']
---

Api-client-java v0.18.0 includes 1 breaking removal, 54 additions, 7 changes.

{/* truncate */}

## Action Required

- Update callers of `agents.createrun()` to stop using `response.status[200].content[text/event-stream]`.

## Changes

- Added `response.results[].reason.enum(commentResolved)` to `triggers.searchevents()`.
- Added `response.results[].reason.enum(commentResolved)` to `triggers.searchpresetevents()`.
- Added `request.createAnnouncementRequest.body.structuredList[].document.metadata.author.relatedDocuments[].results[].structuredResults[].chat.status` to `client.announcements.create()`.
- Added `response.body.structuredList[].document.metadata.author.relatedDocuments[].results[].structuredResults[].chat.status` to `client.announcements.create()`.
- Added `request.updateAnnouncementRequest.body.structuredList[].document.metadata.author.relatedDocuments[].results[].structuredResults[].chat.status` to `client.announcements.update()`.
- Added `response.body.structuredList[].document.metadata.author.relatedDocuments[].results[].structuredResults[].chat.status` to `client.announcements.update()`.
- Added `request.createAnswerRequest.data.addedRoles[].person.relatedDocuments[].results[].structuredResults[].chat.status` to `client.answers.create()`.
- Added `response.addedRoles[].person.relatedDocuments[].results[].structuredResults[].chat.status` to `client.answers.create()`.
- Added `request.editAnswerRequest.addedRoles[].person.relatedDocuments[].results[].structuredResults[].chat.status` to `client.answers.update()`.
- Added `response.addedRoles[].person.relatedDocuments[].results[].structuredResults[].chat.status` to `client.answers.update()`.
- Added `response.answerResult.answer.addedRoles[].person.relatedDocuments[].results[].structuredResults[].chat.status` to `client.answers.retrieve()`.
- Added `response.answerResults[].answer.addedRoles[].person.relatedDocuments[].results[].structuredResults[].chat.status` to `client.answers.list()`.
- Added `request.chatRequest.messages[].citations[].sourceDocument.metadata.author.relatedDocuments[].results[].structuredResults[].chat.status` to `client.chat.create()`.
- Added `response.messages[].citations[].sourceDocument.metadata.author.relatedDocuments[].results[].structuredResults[].chat.status` to `client.chat.create()`.
- Added `error.createdBy.relatedDocuments[].results[].structuredResults[].chat.status` to `client.chat.retrieve()`.
- Added `response.chatResults[].chat.status` to `client.chat.list()`.
- Added `request.chatRequest.messages[].citations[].sourceDocument.metadata.author.relatedDocuments[].results[].structuredResults[].chat.status` to `client.chat.createstream()`.
- Added `response.workflow.author.relatedDocuments[].results[].structuredResults[].chat.status` to `client.agents.create()`.
- Added `response.workflowResult.workflow.author.relatedDocuments[].results[].structuredResults[].chat.status` to `client.agents.import()`.
- Added `response.collection.addedRoles[].person.relatedDocuments[].results[].structuredResults[].chat.status` to `client.collections.additems()`.
- Added `request.createCollectionRequest.addedRoles[].person.relatedDocuments[].results[].structuredResults[].chat.status` to `client.collections.create()`.
- Added `response.union(class (0)).collection.addedRoles[].person.relatedDocuments[].results[].structuredResults[].chat.status` to `client.collections.create()`.
- Added `response.collection.addedRoles[].person.relatedDocuments[].results[].structuredResults[].chat.status` to `client.collections.deleteitem()`.
- Added `request.editCollectionRequest.addedRoles[].person.relatedDocuments[].results[].structuredResults[].chat.status` to `client.collections.update()`.
- Added `response.addedRoles[].person.relatedDocuments[].results[].structuredResults[].chat.status` to `client.collections.update()`.
- Added `response.collection.addedRoles[].person.relatedDocuments[].results[].structuredResults[].chat.status` to `client.collections.updateitem()`.
- Added `response.collection.addedRoles[].person.relatedDocuments[].results[].structuredResults[].chat.status` to `client.collections.retrieve()`.
- Added `response.collections[].addedRoles[].person.relatedDocuments[].results[].structuredResults[].chat.status` to `client.collections.list()`.
- Added `response.documents.Map<DocumentOrError>.union(Document).metadata.author.relatedDocuments[].results[].structuredResults[].chat.status` to `client.documents.retrieve()`.
- Added `response.documents[].metadata.author.relatedDocuments[].results[].structuredResults[].chat.status` to `client.documents.retrievebyfacets()`.
- Added `response.gleanAssist.activityInsights[].user.relatedDocuments[].results[].structuredResults[].chat.status` to `client.insights.retrieve()`.
- Added `response.searchResponse.results[].structuredResults[].chat.status` to `client.messages.retrieve()`.
- Added `response.attribution.relatedDocuments[].results[].structuredResults[].chat.status` to `client.pins.update()`.
- Added `response.pin.attribution.relatedDocuments[].results[].structuredResults[].chat.status` to `client.pins.retrieve()`.
- Added `response.pins[].attribution.relatedDocuments[].results[].structuredResults[].chat.status` to `client.pins.list()`.
- Added `response.attribution.relatedDocuments[].results[].structuredResults[].chat.status` to `client.pins.create()`.
- Added `request.searchRequest.sourceDocument.metadata.author.relatedDocuments[].results[].structuredResults[].chat.status` to `client.search.queryasadmin()`.
- Added `response.results[].structuredResults[].chat.status` to `client.search.queryasadmin()`.
- Added `response.results[].document.metadata.author.relatedDocuments[].results[].structuredResults[].chat.status` to `client.search.autocomplete()`.
- Added `request.recommendationsRequest.sourceDocument.metadata.author.relatedDocuments[].results[].structuredResults[].chat.status` to `client.search.recommendations()`.
- Added `response.results[].structuredResults[].chat.status` to `client.search.recommendations()`.
- Added `request.searchRequest.sourceDocument.metadata.author.relatedDocuments[].results[].structuredResults[].chat.status` to `client.search.query()`.
- Added `response.results[].structuredResults[].chat.status` to `client.search.query()`.
- Added `response.results[].relatedDocuments[].results[].structuredResults[].chat.status` to `client.entities.list()`.
- Added `response.results[].relatedDocuments[].results[].structuredResults[].chat.status` to `client.entities.readpeople()`.
- Added `request.createShortcutRequest.data.addedRoles[].person.relatedDocuments[].results[].structuredResults[].chat.status` to `client.shortcuts.create()`.
- Added `response.shortcut.addedRoles[].person.relatedDocuments[].results[].structuredResults[].chat.status` to `client.shortcuts.create()`.
- Added `response.shortcut.addedRoles[].person.relatedDocuments[].results[].structuredResults[].chat.status` to `client.shortcuts.retrieve()`.
- Added `response.shortcuts[].addedRoles[].person.relatedDocuments[].results[].structuredResults[].chat.status` to `client.shortcuts.list()`.
- Added `request.updateShortcutRequest.addedRoles[].person.relatedDocuments[].results[].structuredResults[].chat.status` to `client.shortcuts.update()`.
- Added `response.shortcut.addedRoles[].person.relatedDocuments[].results[].structuredResults[].chat.status` to `client.shortcuts.update()`.
- Added `response.metadata.lastVerifier.relatedDocuments[].results[].structuredResults[].chat.status` to `client.verification.addreminder()`.
- Added `response.documents[].metadata.lastVerifier.relatedDocuments[].results[].structuredResults[].chat.status` to `client.verification.list()`.
- Added `response.metadata.lastVerifier.relatedDocuments[].results[].structuredResults[].chat.status` to `client.verification.verify()`.
- Changed `request` on `agents.createrun()`.
- Changed `response.agents[]` on `agents.search()`.
- Changed `response.agent` on `agents.get()`.
- Changed `response.[]` on `chat.createstream()`.
- Changed `response.results[]` on `admin.agents.list()`.
- Changed `response.chatResult.chat` on `client.chat.retrieve()`.
- Changed `response.results[].primaryEntry` on `client.search.retrievefeed()`.

## Breaking Changes

- Removed `response.status[200].content[text/event-stream]` from `agents.createrun()`.

## Source

- [Release notes](https://github.com/gleanwork/api-client-java/releases/tag/v0.18.0)
