---
title: 'api-client-python v0.14.0'
categories: ['API Clients']
---

Api-client-python v0.14.0 includes 56 additions, 2 changes.

{/* truncate */}

## Changes

- Added `request.messages[].citations[].source_document.metadata.author.related_documents[].results[].structured_results[].custom_entity.roles[].group.type.enum(collection_audience)` to `client.chat.create()`.
- Added `response.attribution.related_documents[].query_suggestion.ranges[].document.metadata.collections[].added_roles[].group.type.enum(collection_audience)` to `client.pins.update()`.
- Added `request.body.structured_list[].document.metadata.author.related_documents[].results[].structured_results[].custom_entity.roles[].group.type.enum(collection_audience)` to `client.announcements.update()`.
- Added `response.body.structured_list[].document.metadata.author.related_documents[].results[].structured_results[].custom_entity.roles[].group.type.enum(collection_audience)` to `client.announcements.update()`.
- Added `request.data.added_roles[].group.type.enum(collection_audience)` to `client.answers.create()`.
- Added `response.added_roles[].group.type.enum(collection_audience)` to `client.answers.create()`.
- Added `request.added_roles[].group.type.enum(collection_audience)` to `client.answers.update()`.
- Added `response.added_roles[].group.type.enum(collection_audience)` to `client.answers.update()`.
- Added `response.answer_result.answer.added_roles[].group.type.enum(collection_audience)` to `client.answers.retrieve()`.
- Added `response.answer_results[].answer.added_roles[].group.type.enum(collection_audience)` to `client.answers.list()`.
- Added `request.body.structured_list[].document.metadata.author.related_documents[].results[].structured_results[].custom_entity.roles[].group.type.enum(collection_audience)` to `client.announcements.create()`.
- Added `response.body.structured_list[].document.metadata.author.related_documents[].results[].structured_results[].custom_entity.roles[].group.type.enum(collection_audience)` to `client.announcements.create()`.
- Added `response.chat_result.chat.created_by.related_documents[].query_suggestion.ranges[].document.metadata.collections[].added_roles[].group.type.enum(collection_audience)` to `client.chat.retrieve()`.
- Added `response.chat_results[].chat.created_by.related_documents[].query_suggestion.ranges[].document.metadata.collections[].added_roles[].group.type.enum(collection_audience)` to `client.chat.list()`.
- Added `request.messages[].citations[].source_document.metadata.author.related_documents[].results[].structured_results[].custom_entity.roles[].group.type.enum(collection_audience)` to `client.chat.create_stream()`.
- Added `response.collection.added_roles[].group.type.enum(collection_audience)` to `client.collections.add_items()`.
- Added `request.added_roles[].group.type.enum(collection_audience)` to `client.collections.create()`.
- Added `response.union(class (0)).collection.added_roles[].group.type.enum(collection_audience)` to `client.collections.create()`.
- Added `response.collection.added_roles[].group.type.enum(collection_audience)` to `client.collections.delete_item()`.
- Added `request.added_roles[].group.type.enum(collection_audience)` to `client.collections.update()`.
- Added `response.added_roles[].group.type.enum(collection_audience)` to `client.collections.update()`.
- Added `response.collection.added_roles[].group.type.enum(collection_audience)` to `client.collections.update_item()`.
- Added `response.collection.added_roles[].group.type.enum(collection_audience)` to `client.collections.retrieve()`.
- Added `response.collections[].added_roles[].group.type.enum(collection_audience)` to `client.collections.list()`.
- Added `response.documents.Map<DocumentOrError>.union(Document).metadata.author.related_documents[].results[].structured_results[].custom_entity.roles[].group.type.enum(collection_audience)` to `client.documents.retrieve()`.
- Added `response.documents[].metadata.author.related_documents[].results[].structured_results[].custom_entity.roles[].group.type.enum(collection_audience)` to `client.documents.retrieve_by_facets()`.
- Added `response.glean_assist.activity_insights[].user.related_documents[].query_suggestion.ranges[].document.metadata.collections[].added_roles[].group.type.enum(collection_audience)` to `client.insights.retrieve()`.
- Added `response.pin.attribution.related_documents[].query_suggestion.ranges[].document.metadata.collections[].added_roles[].group.type.enum(collection_audience)` to `client.pins.retrieve()`.
- Added `response.search_response.results[].structured_results[].document.metadata.collections[].added_roles[].group.type.enum(collection_audience)` to `client.messages.retrieve()`.
- Added `response.pins[].attribution.related_documents[].query_suggestion.ranges[].document.metadata.collections[].added_roles[].group.type.enum(collection_audience)` to `client.pins.list()`.
- Added `response.attribution.related_documents[].query_suggestion.ranges[].document.metadata.collections[].added_roles[].group.type.enum(collection_audience)` to `client.pins.create()`.
- Added `request.source_document.metadata.author.related_documents[].results[].structured_results[].custom_entity.roles[].group.type.enum(collection_audience)` to `client.search.query_as_admin()`.
- Added `response.results[].structured_results[].document.metadata.collections[].added_roles[].group.type.enum(collection_audience)` to `client.search.query_as_admin()`.
- Added `response.results[].document.metadata.author.related_documents[].results[].structured_results[].custom_entity.roles[].group.type.enum(collection_audience)` to `client.search.autocomplete()`.
- Added `request.categories[].enum(card_stack_promo)` to `client.search.retrieve_feed()`.
- Added `request.source_document.metadata.author.related_documents[].results[].structured_results[].custom_entity.roles[].group.type.enum(collection_audience)` to `client.search.recommendations()`.
- Added `response.results[].structured_results[].document.metadata.collections[].added_roles[].group.type.enum(collection_audience)` to `client.search.recommendations()`.
- Added `request.source_document.metadata.author.related_documents[].results[].structured_results[].custom_entity.roles[].group.type.enum(collection_audience)` to `client.search.query()`.
- Added `response.results[].structured_results[].document.metadata.collections[].added_roles[].group.type.enum(collection_audience)` to `client.search.query()`.
- Added `response.results[].related_documents[].query_suggestion.ranges[].document.metadata.collections[].added_roles[].group.type.enum(collection_audience)` to `client.entities.list()`.
- Added `response.results[].related_documents[].query_suggestion.ranges[].document.metadata.collections[].added_roles[].group.type.enum(collection_audience)` to `client.entities.read_people()`.
- Added `request.data.added_roles[].group.type.enum(collection_audience)` to `client.shortcuts.create()`.
- Added `response.shortcut.added_roles[].group.type.enum(collection_audience)` to `client.shortcuts.create()`.
- Added `response.shortcut.added_roles[].group.type.enum(collection_audience)` to `client.shortcuts.retrieve()`.
- Added `response.shortcuts[].added_roles[].group.type.enum(collection_audience)` to `client.shortcuts.list()`.
- Added `request.added_roles[].group.type.enum(collection_audience)` to `client.shortcuts.update()`.
- Added `response.shortcut.added_roles[].group.type.enum(collection_audience)` to `client.shortcuts.update()`.
- Added `response.metadata.last_verifier.related_documents[].query_suggestion.ranges[].document.metadata.collections[].added_roles[].group.type.enum(collection_audience)` to `client.verification.add_reminder()`.
- Added `response.documents[].metadata.last_verifier.related_documents[].query_suggestion.ranges[].document.metadata.collections[].added_roles[].group.type.enum(collection_audience)` to `client.verification.list()`.
- Added `response.metadata.last_verifier.related_documents[].query_suggestion.ranges[].document.metadata.collections[].added_roles[].group.type.enum(collection_audience)` to `client.verification.verify()`.
- Added `response.report.config.allowlist_options.regexes` to `client.governance.data.policies.retrieve()`.
- Added `request.config.allowlist_options.regexes` to `client.governance.data.policies.update()`.
- Added `response.reports[].config.allowlist_options.regexes` to `client.governance.data.policies.list()`.
- Added `request.config.allowlist_options.regexes` to `client.governance.data.policies.create()`.
- Added `response.report.config.allowlist_options.regexes` to `client.governance.data.policies.create()`.
- Added `request.config.allowlist_options.regexes` to `client.governance.data.reports.create()`.
- Changed `response` on `client.chat.create()`.
- Changed `response.results[]` on `client.search.retrieve_feed()`.

## Source

- [Release notes](https://github.com/gleanwork/api-client-python/releases/tag/v0.14.0)
