---
title: 'api-client-python v0.11.23'
categories: ['API Clients']
---

Api-client-python v0.11.23 includes 6 additions, 51 changes.

{/* truncate */}

## Changes

- Added `response.report.config.sensitive_content_options.custom_sensitive_expressions` to `client.governance.data.policies.retrieve()`.
- Added `request.config.sensitive_content_options.custom_sensitive_expressions` to `client.governance.data.policies.update()`.
- Added `response.reports.[].config.sensitive_content_options.custom_sensitive_expressions` to `client.governance.data.policies.list()`.
- Added `request.config.sensitive_content_options.custom_sensitive_expressions` to `client.governance.data.policies.create()`.
- Added `response.report.config.sensitive_content_options.custom_sensitive_expressions` to `client.governance.data.policies.create()`.
- Added `request.config.sensitive_content_options.custom_sensitive_expressions` to `client.governance.data.reports.create()`.
- Changed `request.body.structured_list.[].document.metadata.author` on `client.announcements.create()`.
- Changed `response.body.structured_list.[].document.metadata.author` on `client.announcements.create()`.
- Changed `request.body.structured_list.[].document.metadata.author` on `client.announcements.update()`.
- Changed `response.body.structured_list.[].document.metadata.author` on `client.announcements.update()`.
- Changed `request.data.added_roles.[].person` on `client.answers.create()`.
- Changed `response.added_roles.[].person` on `client.answers.create()`.
- Changed `request.added_roles.[].person` on `client.answers.update()`.
- Changed `response.added_roles.[].person` on `client.answers.update()`.
- Changed `response.answer_result.answer.added_roles.[].person` on `client.answers.retrieve()`.
- Changed `response.answer_results.[].answer.added_roles.[].person` on `client.answers.list()`.
- Changed `request.messages.[].citations.[].source_document.metadata.author` on `client.chat.create()`.
- Changed `response.messages.[].citations.[].source_document.metadata.author` on `client.chat.create()`.
- Changed `response.chat_result.chat.created_by` on `client.chat.retrieve()`.
- Changed `response.chat_results.[].chat.created_by` on `client.chat.list()`.
- Changed `request.messages.[].citations.[].source_document.metadata.author` on `client.chat.create_stream()`.
- Changed `response.collection.added_roles.[].person` on `client.collections.add_items()`.
- Changed `request.added_roles.[].person` on `client.collections.create()`.
- Changed `response.[class].collection.added_roles.[].person` on `client.collections.create()`.
- Changed `response.collection.added_roles.[].person` on `client.collections.delete_item()`.
- Changed `request.added_roles.[].person` on `client.collections.update()`.
- Changed `response.added_roles.[].person` on `client.collections.update()`.
- Changed `response.collection.added_roles.[].person` on `client.collections.update_item()`.
- Changed `response.collection.added_roles.[].person` on `client.collections.retrieve()`.
- Changed `response.collections.[].added_roles.[].person` on `client.collections.list()`.
- Changed `response.documents.{}.[document].metadata.author` on `client.documents.retrieve()`.
- Changed `response.documents.[].metadata.author` on `client.documents.retrieve_by_facets()`.
- Changed `response` on `client.insights.retrieve()`.
- Changed `response.search_response.results.[].structured_results.[].document.metadata.author` on `client.messages.retrieve()`.
- Changed `response.attribution` on `client.pins.update()`.
- Changed `response.pin.attribution` on `client.pins.retrieve()`.
- Changed `response.pins.[].attribution` on `client.pins.list()`.
- Changed `response.attribution` on `client.pins.create()`.
- Changed `request.source_document.metadata.author` on `client.search.query_as_admin()`.
- Changed `response.results.[].structured_results.[].document.metadata.author` on `client.search.query_as_admin()`.
- Changed `response.results.[].document.metadata.author` on `client.search.autocomplete()`.
- Changed `response.results.[].primary_entry.created_by` on `client.search.retrieve_feed()`.
- Changed `request.source_document.metadata.author` on `client.search.recommendations()`.
- Changed `response.results.[].structured_results.[].document.metadata.author` on `client.search.recommendations()`.
- Changed `request.source_document.metadata.author` on `client.search.query()`.
- Changed `response.results.[].structured_results.[].document.metadata.author` on `client.search.query()`.
- Changed `response.results.[]` on `client.entities.list()`.
- Changed `response.results.[]` on `client.entities.read_people()`.
- Changed `request.data.added_roles.[].person` on `client.shortcuts.create()`.
- Changed `response.shortcut.added_roles.[].person` on `client.shortcuts.create()`.
- Changed `response.shortcut.added_roles.[].person` on `client.shortcuts.retrieve()`.
- Changed `response.shortcuts.[].added_roles.[].person` on `client.shortcuts.list()`.
- Changed `request.added_roles.[].person` on `client.shortcuts.update()`.
- Changed `response.shortcut.added_roles.[].person` on `client.shortcuts.update()`.
- Changed `response.metadata.last_verifier` on `client.verification.add_reminder()`.
- Changed `response.documents.[].metadata.last_verifier` on `client.verification.list()`.
- Changed `response.metadata.last_verifier` on `client.verification.verify()`.

## Source

- [Release notes](https://github.com/gleanwork/api-client-python/releases/tag/v0.11.23)
