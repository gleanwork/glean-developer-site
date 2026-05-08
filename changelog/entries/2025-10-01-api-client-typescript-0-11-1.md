---
title: 'api-client-typescript v0.11.1'
categories: ['API Clients']
---

Api-client-typescript v0.11.1 includes 51 additions.

{/* truncate */}

## Changes

- Added `request.body.structuredList.[].document.metadata.author.relatedDocuments.[].results.[].structuredResults.[].generatedQna.followupActions.[].parameters` to `client.announcements.create()`.
- Added `response.body.structuredList.[].document.metadata.author.relatedDocuments.[].results.[].structuredResults.[].generatedQna.followupActions.[].parameters` to `client.announcements.create()`.
- Added `request.body.structuredList.[].document.metadata.author.relatedDocuments.[].results.[].structuredResults.[].generatedQna.followupActions.[].parameters` to `client.announcements.update()`.
- Added `response.body.structuredList.[].document.metadata.author.relatedDocuments.[].results.[].structuredResults.[].generatedQna.followupActions.[].parameters` to `client.announcements.update()`.
- Added `request.data.addedRoles.[].person.relatedDocuments.[].results.[].structuredResults.[].generatedQna.followupActions.[].parameters` to `client.answers.create()`.
- Added `response.addedroles.[].person.relatedDocuments.[].results.[].structuredResults.[].generatedQna.followupActions.[].parameters` to `client.answers.create()`.
- Added `request.addedRoles.[].person.relatedDocuments.[].results.[].structuredResults.[].generatedQna.followupActions.[].parameters` to `client.answers.update()`.
- Added `response.addedroles.[].person.relatedDocuments.[].results.[].structuredResults.[].generatedQna.followupActions.[].parameters` to `client.answers.update()`.
- Added `response.answerresult.answer.addedRoles.[].person.relatedDocuments.[].results.[].structuredResults.[].generatedQna.followupActions.[].parameters` to `client.answers.retrieve()`.
- Added `response.answerresults.[].answer.addedRoles.[].person.relatedDocuments.[].results.[].structuredResults.[].generatedQna.followupActions.[].parameters` to `client.answers.list()`.
- Added `request.chatrequest.messages.[].citations.[].sourceDocument.metadata.author.relatedDocuments.[].results.[].structuredResults.[].generatedQna.followupActions.[].parameters` to `client.chat.create()`.
- Added `response.messages.[].citations.[].sourceDocument.metadata.author.relatedDocuments.[].results.[].structuredResults.[].generatedQna.followupActions.[].parameters` to `client.chat.create()`.
- Added `response.chatresult.chat.createdBy.relatedDocuments.[].results.[].structuredResults.[].generatedQna.followupActions.[].parameters` to `client.chat.retrieve()`.
- Added `response.chatresults.[].chat.createdBy.relatedDocuments.[].results.[].structuredResults.[].generatedQna.followupActions.[].parameters` to `client.chat.list()`.
- Added `request.chatrequest.messages.[].citations.[].sourceDocument.metadata.author.relatedDocuments.[].results.[].structuredResults.[].generatedQna.followupActions.[].parameters` to `client.chat.createstream()`.
- Added `response.collection.addedRoles.[].person.relatedDocuments.[].results.[].structuredResults.[].generatedQna.followupActions.[].parameters` to `client.collections.additems()`.
- Added `request.addedRoles.[].person.relatedDocuments.[].results.[].structuredResults.[].generatedQna.followupActions.[].parameters` to `client.collections.create()`.
- Added `response.[class].collection.addedRoles.[].person.relatedDocuments.[].results.[].structuredResults.[].generatedQna.followupActions.[].parameters` to `client.collections.create()`.
- Added `response.collection.addedRoles.[].person.relatedDocuments.[].results.[].structuredResults.[].generatedQna.followupActions.[].parameters` to `client.collections.deleteitem()`.
- Added `request.addedRoles.[].person.relatedDocuments.[].results.[].structuredResults.[].generatedQna.followupActions.[].parameters` to `client.collections.update()`.
- Added `response.addedroles.[].person.relatedDocuments.[].results.[].structuredResults.[].generatedQna.followupActions.[].parameters` to `client.collections.update()`.
- Added `response.collection.addedRoles.[].person.relatedDocuments.[].results.[].structuredResults.[].generatedQna.followupActions.[].parameters` to `client.collections.updateitem()`.
- Added `response.collection.addedRoles.[].person.relatedDocuments.[].results.[].structuredResults.[].generatedQna.followupActions.[].parameters` to `client.collections.retrieve()`.
- Added `response.collections.[].addedRoles.[].person.relatedDocuments.[].results.[].structuredResults.[].generatedQna.followupActions.[].parameters` to `client.collections.list()`.
- Added `response.documents.{}.[document].metadata.author.relatedDocuments.[].results.[].structuredResults.[].generatedQna.followupActions.[].parameters` to `client.documents.retrieve()`.
- Added `response.documents.[].metadata.author.relatedDocuments.[].results.[].structuredResults.[].generatedQna.followupActions.[].parameters` to `client.documents.retrievebyfacets()`.
- Added `response.users.activityInsights.[].user.relatedDocuments.[].results.[].structuredResults.[].generatedQna.followupActions.[].parameters` to `client.insights.retrieve()`.
- Added `response.searchresponse.results.[].structuredResults.[].generatedQna.followupActions.[].parameters` to `client.messages.retrieve()`.
- Added `response.attribution.relatedDocuments.[].results.[].structuredResults.[].generatedQna.followupActions.[].parameters` to `client.pins.update()`.
- Added `response.pin.attribution.relatedDocuments.[].results.[].structuredResults.[].generatedQna.followupActions.[].parameters` to `client.pins.retrieve()`.
- Added `response.pins.[].attribution.relatedDocuments.[].results.[].structuredResults.[].generatedQna.followupActions.[].parameters` to `client.pins.list()`.
- Added `response.attribution.relatedDocuments.[].results.[].structuredResults.[].generatedQna.followupActions.[].parameters` to `client.pins.create()`.
- Added `request.sourceDocument.metadata.author.relatedDocuments.[].results.[].structuredResults.[].generatedQna.followupActions.[].parameters` to `client.search.queryasadmin()`.
- Added `response.results.[].structuredResults.[].generatedQna.followupActions.[].parameters` to `client.search.queryasadmin()`.
- Added `response.results.[].document.metadata.author.relatedDocuments.[].results.[].structuredResults.[].generatedQna.followupActions.[].parameters` to `client.search.autocomplete()`.
- Added `response.results.[].primaryEntry.createdBy.relatedDocuments.[].results.[].structuredResults.[].generatedQna.followupActions.[].parameters` to `client.search.retrievefeed()`.
- Added `request.sourceDocument.metadata.author.relatedDocuments.[].results.[].structuredResults.[].generatedQna.followupActions.[].parameters` to `client.search.recommendations()`.
- Added `response.results.[].structuredResults.[].generatedQna.followupActions.[].parameters` to `client.search.recommendations()`.
- Added `request.sourceDocument.metadata.author.relatedDocuments.[].results.[].structuredResults.[].generatedQna.followupActions.[].parameters` to `client.search.query()`.
- Added `response.results.[].structuredResults.[].generatedQna.followupActions.[].parameters` to `client.search.query()`.
- Added `response.results.[].relatedDocuments.[].results.[].structuredResults.[].generatedQna.followupActions.[].parameters` to `client.entities.list()`.
- Added `response.results.[].relatedDocuments.[].results.[].structuredResults.[].generatedQna.followupActions.[].parameters` to `client.entities.readpeople()`.
- Added `request.data.addedRoles.[].person.relatedDocuments.[].results.[].structuredResults.[].generatedQna.followupActions.[].parameters` to `client.shortcuts.create()`.
- Added `response.shortcut.addedRoles.[].person.relatedDocuments.[].results.[].structuredResults.[].generatedQna.followupActions.[].parameters` to `client.shortcuts.create()`.
- Added `response.shortcut.addedRoles.[].person.relatedDocuments.[].results.[].structuredResults.[].generatedQna.followupActions.[].parameters` to `client.shortcuts.retrieve()`.
- Added `response.shortcuts.[].addedRoles.[].person.relatedDocuments.[].results.[].structuredResults.[].generatedQna.followupActions.[].parameters` to `client.shortcuts.list()`.
- Added `request.addedRoles.[].person.relatedDocuments.[].results.[].structuredResults.[].generatedQna.followupActions.[].parameters` to `client.shortcuts.update()`.
- Added `response.shortcut.addedRoles.[].person.relatedDocuments.[].results.[].structuredResults.[].generatedQna.followupActions.[].parameters` to `client.shortcuts.update()`.
- Added `response.metadata.lastVerifier.relatedDocuments.[].results.[].structuredResults.[].generatedQna.followupActions.[].parameters` to `client.verification.addreminder()`.
- Added `response.documents.[].metadata.lastVerifier.relatedDocuments.[].results.[].structuredResults.[].generatedQna.followupActions.[].parameters` to `client.verification.list()`.
- Added `response.metadata.lastVerifier.relatedDocuments.[].results.[].structuredResults.[].generatedQna.followupActions.[].parameters` to `client.verification.verify()`.

## Source

- [Release notes](https://github.com/gleanwork/api-client-typescript/releases/tag/v0.11.1)
