---
title: 'api-client-python v0.13.0'
categories: ['API Clients']
---

Api-client-python v0.13.0 includes 3 additions, 54 changes.

{/* truncate */}

## Changes

- Added `error_code.enum(corrupt_item)` to `client.collections.create()`.
- Added `error_code.enum(corrupt_item)` to `client.collections.delete()`.
- Added `error_code.enum(corrupt_item)` to `client.collections.update()`.
- Changed `response` on `client.collections.add_items()`.
- Changed `request.feedback1.category` on `client.activity.feedback()`.
- Changed `request.body.structured_list[].document.metadata.author.related_documents[].results[].structured_results[].answer` on `client.announcements.create()`.
- Changed `response` on `client.announcements.create()`.
- Changed `request.body.structured_list[].document.metadata.author.related_documents[].results[].structured_results[].answer` on `client.announcements.update()`.
- Changed `response` on `client.announcements.update()`.
- Changed `request.data.added_roles[].person.related_documents[]` on `client.answers.create()`.
- Changed `response` on `client.answers.create()`.
- Changed `request.added_roles[].person.related_documents[]` on `client.answers.update()`.
- Changed `response` on `client.answers.update()`.
- Changed `response.answer_result.answer` on `client.answers.retrieve()`.
- Changed `response.answer_results[].answer` on `client.answers.list()`.
- Changed `request.messages[].citations[].source_document.metadata.author.related_documents[].results[].structured_results[].answer` on `client.chat.create()`.
- Changed `response.messages[].citations[].source_document.metadata.author.related_documents[].results[].structured_results[].answer` on `client.chat.create()`.
- Changed `response.chat_result.chat.created_by.related_documents[]` on `client.chat.retrieve()`.
- Changed `response.chat_results[].chat.created_by.related_documents[]` on `client.chat.list()`.
- Changed `request.messages[].citations[].source_document.metadata.author.related_documents[].results[].structured_results[].answer` on `client.chat.create_stream()`.
- Changed `request.added_roles[].person.related_documents[]` on `client.collections.create()`.
- Changed `response.union(class (0))` on `client.collections.create()`.
- Changed `response.collection` on `client.collections.delete_item()`.
- Changed `request.added_roles[].person.related_documents[]` on `client.collections.update()`.
- Changed `response` on `client.collections.update()`.
- Changed `response.collection` on `client.collections.update_item()`.
- Changed `response` on `client.collections.retrieve()`.
- Changed `response.collections[]` on `client.collections.list()`.
- Changed `response.documents.Map<DocumentOrError>.union(Document).metadata.author.related_documents[].results[].structured_results[].answer` on `client.documents.retrieve()`.
- Changed `response.documents[].metadata.author.related_documents[].results[].structured_results[].answer` on `client.documents.retrieve_by_facets()`.
- Changed `request` on `client.insights.retrieve()`.
- Changed `response` on `client.insights.retrieve()`.
- Changed `response.search_response.results[].structured_results[]` on `client.messages.retrieve()`.
- Changed `response.attribution.related_documents[]` on `client.pins.update()`.
- Changed `response.pin.attribution.related_documents[]` on `client.pins.retrieve()`.
- Changed `response.pins[].attribution.related_documents[]` on `client.pins.list()`.
- Changed `response.attribution.related_documents[]` on `client.pins.create()`.
- Changed `request.source_document.metadata.author.related_documents[].results[].structured_results[].answer` on `client.search.query_as_admin()`.
- Changed `response.results[].structured_results[]` on `client.search.query_as_admin()`.
- Changed `response.results[].document.metadata.author.related_documents[].results[].structured_results[].answer` on `client.search.autocomplete()`.
- Changed `request.categories[]` on `client.search.retrieve_feed()`.
- Changed `response.results[]` on `client.search.retrieve_feed()`.
- Changed `request.source_document.metadata.author.related_documents[].results[].structured_results[].answer` on `client.search.recommendations()`.
- Changed `response.results[].structured_results[]` on `client.search.recommendations()`.
- Changed `request.source_document.metadata.author.related_documents[].results[].structured_results[].answer` on `client.search.query()`.
- Changed `response.results[].structured_results[]` on `client.search.query()`.
- Changed `response.results[].related_documents[]` on `client.entities.list()`.
- Changed `response.results[].related_documents[]` on `client.entities.read_people()`.
- Changed `request.data.added_roles[].person.related_documents[]` on `client.shortcuts.create()`.
- Changed `response.shortcut.added_roles[].person.related_documents[]` on `client.shortcuts.create()`.
- Changed `response.shortcut.added_roles[].person.related_documents[]` on `client.shortcuts.retrieve()`.
- Changed `response.shortcuts[].added_roles[].person.related_documents[]` on `client.shortcuts.list()`.
- Changed `request.added_roles[].person.related_documents[]` on `client.shortcuts.update()`.
- Changed `response.shortcut.added_roles[].person.related_documents[]` on `client.shortcuts.update()`.
- Changed `response.metadata.last_verifier.related_documents[]` on `client.verification.add_reminder()`.
- Changed `response.documents[].metadata.last_verifier.related_documents[]` on `client.verification.list()`.
- Changed `response.metadata.last_verifier.related_documents[]` on `client.verification.verify()`.

## Source

- [Release notes](https://github.com/gleanwork/api-client-python/releases/tag/v0.13.0)
