---
title: 'api-client-typescript v0.20.17'
categories: ['API Clients']
---

Api-client-typescript v0.20.17 includes 59 additions, 1 change.

{/* truncate */}

## Changes

- Added `response.results[].reason.enum(webhookCreated)` to `triggers.searchevents()`.
- Added `response.results[].reason.enum(webhookCreated)` to `triggers.searchpresetevents()`.
- Added `request.createAnnouncementRequest.body.structuredList[].document.metadata.author.metadata.socialNetwork[].iconUrl` to `client.announcements.create()`.
- Added `response.body.structuredList[].document.metadata.author.metadata.socialNetwork[].iconUrl` to `client.announcements.create()`.
- Added `request.updateAnnouncementRequest.body.structuredList[].document.metadata.author.metadata.socialNetwork[].iconUrl` to `client.announcements.update()`.
- Added `response.body.structuredList[].document.metadata.author.metadata.socialNetwork[].iconUrl` to `client.announcements.update()`.
- Added `request.createAnswerRequest.data.addedRoles[].person.metadata.socialNetwork[].iconUrl` to `client.answers.create()`.
- Added `response.addedRoles[].person.metadata.socialNetwork[].iconUrl` to `client.answers.create()`.
- Added `request.editAnswerRequest.addedRoles[].person.metadata.socialNetwork[].iconUrl` to `client.answers.update()`.
- Added `response.addedRoles[].person.metadata.socialNetwork[].iconUrl` to `client.answers.update()`.
- Added `response.answerResult.answer.addedRoles[].person.metadata.socialNetwork[].iconUrl` to `client.answers.retrieve()`.
- Added `response.answerResults[].answer.addedRoles[].person.metadata.socialNetwork[].iconUrl` to `client.answers.list()`.
- Added `request.chatRequest.messages[].citations[].sourceDocument.metadata.author.metadata.socialNetwork[].iconUrl` to `client.chat.create()`.
- Added `response.messages[].citations[].sourceDocument.metadata.author.metadata.socialNetwork[].iconUrl` to `client.chat.create()`.
- Added `response.chatResult.chat.createdBy.metadata.socialNetwork[].iconUrl` to `client.chat.retrieve()`.
- Added `error.createdBy.metadata.socialNetwork[].iconUrl` to `client.chat.retrieve()`.
- Added `response.chatResults[].chat.createdBy.metadata.socialNetwork[].iconUrl` to `client.chat.list()`.
- Added `request.chatRequest.messages[].citations[].sourceDocument.metadata.author.metadata.socialNetwork[].iconUrl` to `client.chat.createstream()`.
- Added `response.workflow.author.metadata.socialNetwork[].iconUrl` to `client.agents.create()`.
- Added `response.workflowResult.workflow.author.metadata.socialNetwork[].iconUrl` to `client.agents.import()`.
- Added `response.collection.addedRoles[].person.metadata.socialNetwork[].iconUrl` to `client.collections.additems()`.
- Added `request.createCollectionRequest.addedRoles[].person.metadata.socialNetwork[].iconUrl` to `client.collections.create()`.
- Added `response.union(class (0)).collection.addedRoles[].person.metadata.socialNetwork[].iconUrl` to `client.collections.create()`.
- Added `response.collection.addedRoles[].person.metadata.socialNetwork[].iconUrl` to `client.collections.deleteitem()`.
- Added `request.editCollectionRequest.addedRoles[].person.metadata.socialNetwork[].iconUrl` to `client.collections.update()`.
- Added `response.addedRoles[].person.metadata.socialNetwork[].iconUrl` to `client.collections.update()`.
- Added `response.collection.addedRoles[].person.metadata.socialNetwork[].iconUrl` to `client.collections.updateitem()`.
- Added `response.collection.addedRoles[].person.metadata.socialNetwork[].iconUrl` to `client.collections.retrieve()`.
- Added `response.collections[].addedRoles[].person.metadata.socialNetwork[].iconUrl` to `client.collections.list()`.
- Added `response.documents.Map<DocumentOrError>.union(Document).metadata.author.metadata.socialNetwork[].iconUrl` to `client.documents.retrieve()`.
- Added `response.documents[].metadata.author.metadata.socialNetwork[].iconUrl` to `client.documents.retrievebyfacets()`.
- Added `response.gleanAssist.activityInsights[].user.metadata.socialNetwork[].iconUrl` to `client.insights.retrieve()`.
- Added `response.searchResponse.results[].structuredResults[].document.metadata.author.metadata.socialNetwork[].iconUrl` to `client.messages.retrieve()`.
- Added `response.attribution.metadata.socialNetwork[].iconUrl` to `client.pins.update()`.
- Added `response.pin.attribution.metadata.socialNetwork[].iconUrl` to `client.pins.retrieve()`.
- Added `response.pins[].attribution.metadata.socialNetwork[].iconUrl` to `client.pins.list()`.
- Added `response.attribution.metadata.socialNetwork[].iconUrl` to `client.pins.create()`.
- Added `request.searchRequest.sourceDocument.metadata.author.metadata.socialNetwork[].iconUrl` to `client.search.queryasadmin()`.
- Added `response.results[].structuredResults[].document.metadata.author.metadata.socialNetwork[].iconUrl` to `client.search.queryasadmin()`.
- Added `response.results[].document.metadata.author.metadata.socialNetwork[].iconUrl` to `client.search.autocomplete()`.
- Added `request.feedRequest.categories[].enum(zeroStateGleanAgentCoworkers)` to `client.search.retrievefeed()`.
- Added `request.recommendationsRequest.sourceDocument.metadata.author.metadata.socialNetwork[].iconUrl` to `client.search.recommendations()`.
- Added `response.results[].structuredResults[].document.metadata.author.metadata.socialNetwork[].iconUrl` to `client.search.recommendations()`.
- Added `request.searchRequest.sourceDocument.metadata.author.metadata.socialNetwork[].iconUrl` to `client.search.query()`.
- Added `response.results[].structuredResults[].document.metadata.author.metadata.socialNetwork[].iconUrl` to `client.search.query()`.
- Added `response.results[].metadata.socialNetwork[].iconUrl` to `client.entities.list()`.
- Added `response.results[].metadata.socialNetwork[].iconUrl` to `client.entities.readpeople()`.
- Added `request.createShortcutRequest.data.addedRoles[].person.metadata.socialNetwork[].iconUrl` to `client.shortcuts.create()`.
- Added `response.shortcut.addedRoles[].person.metadata.socialNetwork[].iconUrl` to `client.shortcuts.create()`.
- Added `response.shortcut.addedRoles[].person.metadata.socialNetwork[].iconUrl` to `client.shortcuts.retrieve()`.
- Added `response.shortcuts[].addedRoles[].person.metadata.socialNetwork[].iconUrl` to `client.shortcuts.list()`.
- Added `request.updateShortcutRequest.addedRoles[].person.metadata.socialNetwork[].iconUrl` to `client.shortcuts.update()`.
- Added `response.shortcut.addedRoles[].person.metadata.socialNetwork[].iconUrl` to `client.shortcuts.update()`.
- Added `response.metadata.lastVerifier.metadata.socialNetwork[].iconUrl` to `client.verification.addreminder()`.
- Added `response.documents[].metadata.lastVerifier.metadata.socialNetwork[].iconUrl` to `client.verification.list()`.
- Added `response.metadata.lastVerifier.metadata.socialNetwork[].iconUrl` to `client.verification.verify()`.
- Added `request.exportType.enum(findingsCsv)` to `client.governance.data.findings.create()`.
- Added `response.exportType.enum(findingsCsv)` to `client.governance.data.findings.create()`.
- Added `response.exports[].exportType.enum(findingsCsv)` to `client.governance.data.findings.list()`.
- Changed `response.results[]` on `client.search.retrievefeed()`.

## Source

- [Release notes](https://github.com/gleanwork/api-client-typescript/releases/tag/v0.20.17)
