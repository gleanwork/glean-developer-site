---
title: 'api-client-python v0.15.1'
categories: ['API Clients']
---

Api-client-python v0.15.1 includes 3 additions, 55 changes.

{/* truncate */}

## Changes

- Added `error.code.enum(request_too_large)` to `agents.get()`.
- Added `error.code.enum(request_too_large)` to `agents.get_schemas()`.
- Added `request.categories[].enum(podcast)` to `client.search.retrieve_feed()`.
- Changed `error` on `agents.search()`.
- Changed `error` on `agents.create_run()`.
- Changed `error` on `search.query()`.
- Changed `request.body.structured_list[].document.metadata.author.related_documents[].results[]` on `client.announcements.create()`.
- Changed `response` on `client.announcements.create()`.
- Changed `request.body.structured_list[].document.metadata.author.related_documents[].results[]` on `client.announcements.update()`.
- Changed `response` on `client.announcements.update()`.
- Changed `request.data.added_roles[].person.related_documents[].query_suggestion.ranges[].document.metadata` on `client.answers.create()`.
- Changed `response.added_roles[].person.related_documents[].query_suggestion.ranges[].document.metadata` on `client.answers.create()`.
- Changed `request.added_roles[].person.related_documents[].query_suggestion.ranges[].document.metadata` on `client.answers.update()`.
- Changed `response.added_roles[].person.related_documents[].query_suggestion.ranges[].document.metadata` on `client.answers.update()`.
- Changed `response.answer_result` on `client.answers.retrieve()`.
- Changed `response.answer_results[]` on `client.answers.list()`.
- Changed `request.messages[].citations[].source_document.metadata.author.related_documents[].results[]` on `client.chat.create()`.
- Changed `response.messages[].citations[].source_document.metadata.author.related_documents[].results[]` on `client.chat.create()`.
- Changed `response.chat_result.chat.created_by.related_documents[].query_suggestion.ranges[].document.metadata` on `client.chat.retrieve()`.
- Changed `response.chat_results[].chat.created_by.related_documents[].query_suggestion.ranges[].document.metadata` on `client.chat.list()`.
- Changed `request.messages[].citations[].source_document.metadata.author.related_documents[].results[]` on `client.chat.create_stream()`.
- Changed `response.workflow.author.related_documents[].query_suggestion.ranges[].document.metadata` on `client.agents.create()`.
- Changed `response.collection` on `client.collections.add_items()`.
- Changed `request.added_roles[].person.related_documents[].query_suggestion.ranges[].document.metadata` on `client.collections.create()`.
- Changed `response.union(class (0)).collection` on `client.collections.create()`.
- Changed `response.collection` on `client.collections.delete_item()`.
- Changed `request.added_roles[].person.related_documents[].query_suggestion.ranges[].document.metadata` on `client.collections.update()`.
- Changed `response` on `client.collections.update()`.
- Changed `response.collection` on `client.collections.update_item()`.
- Changed `response.collection` on `client.collections.retrieve()`.
- Changed `response.collections[]` on `client.collections.list()`.
- Changed `response.documents.Map<DocumentOrError>.union(Document).metadata.author.related_documents[].results[]` on `client.documents.retrieve()`.
- Changed `response.documents[].metadata.author.related_documents[].results[]` on `client.documents.retrieve_by_facets()`.
- Changed `response.glean_assist.activity_insights[].user.related_documents[].query_suggestion.ranges[].document.metadata` on `client.insights.retrieve()`.
- Changed `response.search_response.results[].structured_results[].document.metadata` on `client.messages.retrieve()`.
- Changed `response` on `client.pins.update()`.
- Changed `response.pin` on `client.pins.retrieve()`.
- Changed `response.pins[]` on `client.pins.list()`.
- Changed `response` on `client.pins.create()`.
- Changed `request.source_document.metadata.author.related_documents[].results[]` on `client.search.query_as_admin()`.
- Changed `response.results[].structured_results[].document.metadata` on `client.search.query_as_admin()`.
- Changed `response.results[].document.metadata.author.related_documents[].results[]` on `client.search.autocomplete()`.
- Changed `response.results[]` on `client.search.retrieve_feed()`.
- Changed `request.source_document.metadata.author.related_documents[].results[]` on `client.search.recommendations()`.
- Changed `response.results[].structured_results[].document.metadata` on `client.search.recommendations()`.
- Changed `request.source_document.metadata.author.related_documents[].results[]` on `client.search.query()`.
- Changed `response.results[].structured_results[].document.metadata` on `client.search.query()`.
- Changed `response.results[].related_documents[].query_suggestion.ranges[].document.metadata` on `client.entities.list()`.
- Changed `response.results[].related_documents[].query_suggestion.ranges[].document.metadata` on `client.entities.read_people()`.
- Changed `request.data.added_roles[].person.related_documents[].query_suggestion.ranges[].document.metadata` on `client.shortcuts.create()`.
- Changed `response.shortcut` on `client.shortcuts.create()`.
- Changed `response.shortcut` on `client.shortcuts.retrieve()`.
- Changed `response.shortcuts[]` on `client.shortcuts.list()`.
- Changed `request.added_roles[].person.related_documents[].query_suggestion.ranges[].document.metadata` on `client.shortcuts.update()`.
- Changed `response.shortcut` on `client.shortcuts.update()`.
- Changed `response.metadata.last_verifier.related_documents[].query_suggestion.ranges[].document.metadata` on `client.verification.add_reminder()`.
- Changed `response.documents[].metadata.last_verifier.related_documents[].query_suggestion.ranges[].document.metadata` on `client.verification.list()`.
- Changed `response.metadata.last_verifier.related_documents[].query_suggestion.ranges[].document.metadata` on `client.verification.verify()`.

## Source

- [Release notes](https://github.com/gleanwork/api-client-python/releases/tag/v0.15.1)
