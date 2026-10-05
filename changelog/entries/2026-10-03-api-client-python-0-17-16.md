---
title: 'api-client-python v0.17.16'
categories: ['API Clients']
---

Api-client-python v0.17.16 includes 2 breaking removals, 4 additions, 67 changes.

{/* truncate */}

## Action Required

- Update callers of `skills.preview_source()` to stop using `request.stream`.
- Update callers of `skills.preview_source()` to stop using `response.status[200].content[text/event-stream]`.

## Changes

- Added `error.status[409]` to `skills.create()`.
- Added `error.status[422]` to `skills.import()`.
- Added `error.status[422]` to `skills.preview_source()`.
- Added `request.fallback_to_authenticated_identity` to `client.entities.read_people()`.
- Changed `response` on `skills.create()`.
- Changed `request.page_size` on `skills.list()`.
- Changed `response` on `skills.list()`.
- Changed `response` on `skills.import()`.
- Changed `response.skill` on `skills.update()`.
- Changed `response.skill` on `skills.retrieve()`.
- Changed `response` on `skills.sync()`.
- Changed `error` on `skills.sync()`.
- Changed `response` on `skills.create_version()`.
- Changed `request.page_size` on `skills.list_versions()`.
- Changed `response` on `skills.list_versions()`.
- Changed `request.body.structured_list[].document.metadata.author` on `client.announcements.create()`.
- Changed `response.body.structured_list[].document.metadata.author` on `client.announcements.create()`.
- Changed `request.body.structured_list[].document.metadata.author` on `client.announcements.update()`.
- Changed `response.body.structured_list[].document.metadata.author` on `client.announcements.update()`.
- Changed `request.data.added_roles[].person` on `client.answers.create()`.
- Changed `response.added_roles[].person` on `client.answers.create()`.
- Changed `request.added_roles[].person` on `client.answers.update()`.
- Changed `response.added_roles[].person` on `client.answers.update()`.
- Changed `response.answer_result.answer.added_roles[].person` on `client.answers.retrieve()`.
- Changed `response.answer_results[].answer.added_roles[].person` on `client.answers.list()`.
- Changed `request.messages[].citations[].source_document.metadata.author` on `client.chat.create()`.
- Changed `response.messages[].citations[].source_document.metadata.author` on `client.chat.create()`.
- Changed `response.chat_result.chat.created_by` on `client.chat.retrieve()`.
- Changed `error.created_by` on `client.chat.retrieve()`.
- Changed `response.chat_results[].chat.created_by` on `client.chat.list()`.
- Changed `request.messages[].citations[].source_document.metadata.author` on `client.chat.create_stream()`.
- Changed `response.workflow.author` on `client.agents.create()`.
- Changed `response.workflow_result.workflow.author` on `client.agents.import()`.
- Changed `response.collection.added_roles[].person` on `client.collections.add_items()`.
- Changed `request.added_roles[].person` on `client.collections.create()`.
- Changed `response.union(class (0)).collection.added_roles[].person` on `client.collections.create()`.
- Changed `response.collection.added_roles[].person` on `client.collections.delete_item()`.
- Changed `request.added_roles[].person` on `client.collections.update()`.
- Changed `response.added_roles[].person` on `client.collections.update()`.
- Changed `response.collection.added_roles[].person` on `client.collections.update_item()`.
- Changed `response.collection.added_roles[].person` on `client.collections.retrieve()`.
- Changed `response.collections[].added_roles[].person` on `client.collections.list()`.
- Changed `response.documents.Map<DocumentOrError>.union(Document).metadata.author` on `client.documents.retrieve()`.
- Changed `response.documents[].metadata.author` on `client.documents.retrieve_by_facets()`.
- Changed `request.mcp_breakdown_request` on `client.insights.retrieve()`.
- Changed `response` on `client.insights.retrieve()`.
- Changed `response.search_response.results[].structured_results[].document.metadata` on `client.messages.retrieve()`.
- Changed `response.attribution` on `client.pins.update()`.
- Changed `response.pin.attribution` on `client.pins.retrieve()`.
- Changed `response.pins[].attribution` on `client.pins.list()`.
- Changed `response.attribution` on `client.pins.create()`.
- Changed `request.source_document.metadata.author` on `client.search.query_as_admin()`.
- Changed `response.results[].structured_results[].document.metadata` on `client.search.query_as_admin()`.
- Changed `response.results[]` on `client.search.autocomplete()`.
- Changed `request.categories[]` on `client.search.retrieve_feed()`.
- Changed `response.results[]` on `client.search.retrieve_feed()`.
- Changed `request.source_document.metadata.author` on `client.search.recommendations()`.
- Changed `response.results[].structured_results[].document.metadata` on `client.search.recommendations()`.
- Changed `request.source_document.metadata.author` on `client.search.query()`.
- Changed `response.results[].structured_results[].document.metadata` on `client.search.query()`.
- Changed `response.results[]` on `client.entities.list()`.
- Changed `response.results[]` on `client.entities.read_people()`.
- Changed `request.data.added_roles[].person` on `client.shortcuts.create()`.
- Changed `response.shortcut.added_roles[].person` on `client.shortcuts.create()`.
- Changed `response.shortcut.added_roles[].person` on `client.shortcuts.retrieve()`.
- Changed `response.shortcuts[].added_roles[].person` on `client.shortcuts.list()`.
- Changed `request.added_roles[].person` on `client.shortcuts.update()`.
- Changed `response.shortcut.added_roles[].person` on `client.shortcuts.update()`.
- Changed `response.metadata.last_verifier` on `client.verification.add_reminder()`.
- Changed `response.documents[].metadata.last_verifier` on `client.verification.list()`.
- Changed `response.metadata.last_verifier` on `client.verification.verify()`.

## Breaking Changes

- Removed `request.stream` from `skills.preview_source()`.
- Removed `response.status[200].content[text/event-stream]` from `skills.preview_source()`.

## Source

- [Release notes](https://github.com/gleanwork/api-client-python/releases/tag/v0.17.16)
