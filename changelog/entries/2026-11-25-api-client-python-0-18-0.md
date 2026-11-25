---
title: 'api-client-python v0.18.0'
categories: ['API Clients']
---

Api-client-python v0.18.0 includes 2 breaking removals, 54 additions, 6 changes.

{/* truncate */}

## Action Required

- Update callers of `agents.create_run()` to stop using `request.stream`.
- Update callers of `agents.create_run()` to stop using `response.status[200].content[text/event-stream]`.

## Changes

- Added `response.results[].reason.enum(comment_resolved)` to `triggers.search_events()`.
- Added `response.results[].reason.enum(comment_resolved)` to `triggers.search_preset_events()`.
- Added `request.body.structured_list[].document.metadata.author.related_documents[].results[].structured_results[].chat.status` to `client.announcements.create()`.
- Added `response.body.structured_list[].document.metadata.author.related_documents[].results[].structured_results[].chat.status` to `client.announcements.create()`.
- Added `request.body.structured_list[].document.metadata.author.related_documents[].results[].structured_results[].chat.status` to `client.announcements.update()`.
- Added `response.body.structured_list[].document.metadata.author.related_documents[].results[].structured_results[].chat.status` to `client.announcements.update()`.
- Added `request.data.added_roles[].person.related_documents[].results[].structured_results[].chat.status` to `client.answers.create()`.
- Added `response.added_roles[].person.related_documents[].results[].structured_results[].chat.status` to `client.answers.create()`.
- Added `request.added_roles[].person.related_documents[].results[].structured_results[].chat.status` to `client.answers.update()`.
- Added `response.added_roles[].person.related_documents[].results[].structured_results[].chat.status` to `client.answers.update()`.
- Added `response.answer_result.answer.added_roles[].person.related_documents[].results[].structured_results[].chat.status` to `client.answers.retrieve()`.
- Added `response.answer_results[].answer.added_roles[].person.related_documents[].results[].structured_results[].chat.status` to `client.answers.list()`.
- Added `request.messages[].citations[].source_document.metadata.author.related_documents[].results[].structured_results[].chat.status` to `client.chat.create()`.
- Added `response.messages[].citations[].source_document.metadata.author.related_documents[].results[].structured_results[].chat.status` to `client.chat.create()`.
- Added `error.created_by.related_documents[].results[].structured_results[].chat.status` to `client.chat.retrieve()`.
- Added `response.chat_results[].chat.status` to `client.chat.list()`.
- Added `request.messages[].citations[].source_document.metadata.author.related_documents[].results[].structured_results[].chat.status` to `client.chat.create_stream()`.
- Added `response.workflow.author.related_documents[].results[].structured_results[].chat.status` to `client.agents.create()`.
- Added `response.workflow_result.workflow.author.related_documents[].results[].structured_results[].chat.status` to `client.agents.import()`.
- Added `response.collection.added_roles[].person.related_documents[].results[].structured_results[].chat.status` to `client.collections.add_items()`.
- Added `request.added_roles[].person.related_documents[].results[].structured_results[].chat.status` to `client.collections.create()`.
- Added `response.union(class (0)).collection.added_roles[].person.related_documents[].results[].structured_results[].chat.status` to `client.collections.create()`.
- Added `response.collection.added_roles[].person.related_documents[].results[].structured_results[].chat.status` to `client.collections.delete_item()`.
- Added `request.added_roles[].person.related_documents[].results[].structured_results[].chat.status` to `client.collections.update()`.
- Added `response.added_roles[].person.related_documents[].results[].structured_results[].chat.status` to `client.collections.update()`.
- Added `response.collection.added_roles[].person.related_documents[].results[].structured_results[].chat.status` to `client.collections.update_item()`.
- Added `response.collection.added_roles[].person.related_documents[].results[].structured_results[].chat.status` to `client.collections.retrieve()`.
- Added `response.collections[].added_roles[].person.related_documents[].results[].structured_results[].chat.status` to `client.collections.list()`.
- Added `response.documents.Map<DocumentOrError>.union(Document).metadata.author.related_documents[].results[].structured_results[].chat.status` to `client.documents.retrieve()`.
- Added `response.documents[].metadata.author.related_documents[].results[].structured_results[].chat.status` to `client.documents.retrieve_by_facets()`.
- Added `response.glean_assist.activity_insights[].user.related_documents[].results[].structured_results[].chat.status` to `client.insights.retrieve()`.
- Added `response.search_response.results[].structured_results[].chat.status` to `client.messages.retrieve()`.
- Added `response.attribution.related_documents[].results[].structured_results[].chat.status` to `client.pins.update()`.
- Added `response.pin.attribution.related_documents[].results[].structured_results[].chat.status` to `client.pins.retrieve()`.
- Added `response.pins[].attribution.related_documents[].results[].structured_results[].chat.status` to `client.pins.list()`.
- Added `response.attribution.related_documents[].results[].structured_results[].chat.status` to `client.pins.create()`.
- Added `request.source_document.metadata.author.related_documents[].results[].structured_results[].chat.status` to `client.search.query_as_admin()`.
- Added `response.results[].structured_results[].chat.status` to `client.search.query_as_admin()`.
- Added `response.results[].document.metadata.author.related_documents[].results[].structured_results[].chat.status` to `client.search.autocomplete()`.
- Added `request.source_document.metadata.author.related_documents[].results[].structured_results[].chat.status` to `client.search.recommendations()`.
- Added `response.results[].structured_results[].chat.status` to `client.search.recommendations()`.
- Added `request.source_document.metadata.author.related_documents[].results[].structured_results[].chat.status` to `client.search.query()`.
- Added `response.results[].structured_results[].chat.status` to `client.search.query()`.
- Added `response.results[].related_documents[].results[].structured_results[].chat.status` to `client.entities.list()`.
- Added `response.results[].related_documents[].results[].structured_results[].chat.status` to `client.entities.read_people()`.
- Added `request.data.added_roles[].person.related_documents[].results[].structured_results[].chat.status` to `client.shortcuts.create()`.
- Added `response.shortcut.added_roles[].person.related_documents[].results[].structured_results[].chat.status` to `client.shortcuts.create()`.
- Added `response.shortcut.added_roles[].person.related_documents[].results[].structured_results[].chat.status` to `client.shortcuts.retrieve()`.
- Added `response.shortcuts[].added_roles[].person.related_documents[].results[].structured_results[].chat.status` to `client.shortcuts.list()`.
- Added `request.added_roles[].person.related_documents[].results[].structured_results[].chat.status` to `client.shortcuts.update()`.
- Added `response.shortcut.added_roles[].person.related_documents[].results[].structured_results[].chat.status` to `client.shortcuts.update()`.
- Added `response.metadata.last_verifier.related_documents[].results[].structured_results[].chat.status` to `client.verification.add_reminder()`.
- Added `response.documents[].metadata.last_verifier.related_documents[].results[].structured_results[].chat.status` to `client.verification.list()`.
- Added `response.metadata.last_verifier.related_documents[].results[].structured_results[].chat.status` to `client.verification.verify()`.
- Changed `response.agents[]` on `agents.search()`.
- Changed `response.agent` on `agents.get()`.
- Changed `response.[]` on `chat.create_stream()`.
- Changed `response.results[]` on `admin.agents.list()`.
- Changed `response.chat_result.chat` on `client.chat.retrieve()`.
- Changed `response.results[].primary_entry` on `client.search.retrieve_feed()`.

## Breaking Changes

- Removed `request.stream` from `agents.create_run()`.
- Removed `response.status[200].content[text/event-stream]` from `agents.create_run()`.

## Source

- [Release notes](https://github.com/gleanwork/api-client-python/releases/tag/v0.18.0)
