---
title: 'api-client-python v0.17.2'
categories: ['API Clients']
---

Api-client-python v0.17.2 includes 54 additions.

{/* truncate */}

## Changes

- Added `request.body.structured_list[].document.metadata.author.related_documents[].results[].structured_results[].answer.collections[].items[].shortcut.favorite_info.ugc_type.enum(skills_type)` to `client.announcements.create()`.
- Added `response.body.structured_list[].document.metadata.author.related_documents[].results[].structured_results[].answer.collections[].items[].shortcut.favorite_info.ugc_type.enum(skills_type)` to `client.announcements.create()`.
- Added `request.body.structured_list[].document.metadata.author.related_documents[].results[].structured_results[].answer.collections[].items[].shortcut.favorite_info.ugc_type.enum(skills_type)` to `client.announcements.update()`.
- Added `response.body.structured_list[].document.metadata.author.related_documents[].results[].structured_results[].answer.collections[].items[].shortcut.favorite_info.ugc_type.enum(skills_type)` to `client.announcements.update()`.
- Added `request.data.added_roles[].person.related_documents[].query_suggestion.ranges[].document.metadata.pins[].favorite_info.ugc_type.enum(skills_type)` to `client.answers.create()`.
- Added `response.added_roles[].person.related_documents[].query_suggestion.ranges[].document.metadata.pins[].favorite_info.ugc_type.enum(skills_type)` to `client.answers.create()`.
- Added `request.added_roles[].person.related_documents[].query_suggestion.ranges[].document.metadata.pins[].favorite_info.ugc_type.enum(skills_type)` to `client.answers.update()`.
- Added `response.added_roles[].person.related_documents[].query_suggestion.ranges[].document.metadata.pins[].favorite_info.ugc_type.enum(skills_type)` to `client.answers.update()`.
- Added `response.answer_result.answer.added_roles[].person.related_documents[].query_suggestion.ranges[].document.metadata.pins[].favorite_info.ugc_type.enum(skills_type)` to `client.answers.retrieve()`.
- Added `response.answer_results[].answer.added_roles[].person.related_documents[].query_suggestion.ranges[].document.metadata.pins[].favorite_info.ugc_type.enum(skills_type)` to `client.answers.list()`.
- Added `request.messages[].citations[].source_document.metadata.author.related_documents[].results[].structured_results[].answer.collections[].items[].shortcut.favorite_info.ugc_type.enum(skills_type)` to `client.chat.create()`.
- Added `response.messages[].citations[].source_document.metadata.author.related_documents[].results[].structured_results[].answer.collections[].items[].shortcut.favorite_info.ugc_type.enum(skills_type)` to `client.chat.create()`.
- Added `response.chat_result.chat.created_by.related_documents[].query_suggestion.ranges[].document.metadata.pins[].favorite_info.ugc_type.enum(skills_type)` to `client.chat.retrieve()`.
- Added `error.created_by.related_documents[].query_suggestion.ranges[].document.metadata.pins[].favorite_info.ugc_type.enum(skills_type)` to `client.chat.retrieve()`.
- Added `response.chat_results[].chat.created_by.related_documents[].query_suggestion.ranges[].document.metadata.pins[].favorite_info.ugc_type.enum(skills_type)` to `client.chat.list()`.
- Added `request.messages[].citations[].source_document.metadata.author.related_documents[].results[].structured_results[].answer.collections[].items[].shortcut.favorite_info.ugc_type.enum(skills_type)` to `client.chat.create_stream()`.
- Added `response.workflow.author.related_documents[].query_suggestion.ranges[].document.metadata.pins[].favorite_info.ugc_type.enum(skills_type)` to `client.agents.create()`.
- Added `response.workflow_result.workflow.author.related_documents[].query_suggestion.ranges[].document.metadata.pins[].favorite_info.ugc_type.enum(skills_type)` to `client.agents.import()`.
- Added `response.collection.added_roles[].person.related_documents[].query_suggestion.ranges[].document.metadata.pins[].favorite_info.ugc_type.enum(skills_type)` to `client.collections.add_items()`.
- Added `request.added_roles[].person.related_documents[].query_suggestion.ranges[].document.metadata.pins[].favorite_info.ugc_type.enum(skills_type)` to `client.collections.create()`.
- Added `response.union(class (0)).collection.added_roles[].person.related_documents[].query_suggestion.ranges[].document.metadata.pins[].favorite_info.ugc_type.enum(skills_type)` to `client.collections.create()`.
- Added `response.collection.added_roles[].person.related_documents[].query_suggestion.ranges[].document.metadata.pins[].favorite_info.ugc_type.enum(skills_type)` to `client.collections.delete_item()`.
- Added `request.added_roles[].person.related_documents[].query_suggestion.ranges[].document.metadata.pins[].favorite_info.ugc_type.enum(skills_type)` to `client.collections.update()`.
- Added `response.added_roles[].person.related_documents[].query_suggestion.ranges[].document.metadata.pins[].favorite_info.ugc_type.enum(skills_type)` to `client.collections.update()`.
- Added `response.collection.added_roles[].person.related_documents[].query_suggestion.ranges[].document.metadata.pins[].favorite_info.ugc_type.enum(skills_type)` to `client.collections.update_item()`.
- Added `response.collection.added_roles[].person.related_documents[].query_suggestion.ranges[].document.metadata.pins[].favorite_info.ugc_type.enum(skills_type)` to `client.collections.retrieve()`.
- Added `response.collections[].added_roles[].person.related_documents[].query_suggestion.ranges[].document.metadata.pins[].favorite_info.ugc_type.enum(skills_type)` to `client.collections.list()`.
- Added `response.documents.Map<DocumentOrError>.union(Document).metadata.author.related_documents[].results[].structured_results[].answer.collections[].items[].shortcut.favorite_info.ugc_type.enum(skills_type)` to `client.documents.retrieve()`.
- Added `response.documents[].metadata.author.related_documents[].results[].structured_results[].answer.collections[].items[].shortcut.favorite_info.ugc_type.enum(skills_type)` to `client.documents.retrieve_by_facets()`.
- Added `response.glean_assist.activity_insights[].user.related_documents[].query_suggestion.ranges[].document.metadata.pins[].favorite_info.ugc_type.enum(skills_type)` to `client.insights.retrieve()`.
- Added `response.search_response.results[].structured_results[].document.metadata.pins[].favorite_info.ugc_type.enum(skills_type)` to `client.messages.retrieve()`.
- Added `response.attribution.related_documents[].query_suggestion.ranges[].document.metadata.collections[].items[].shortcut.favorite_info.ugc_type.enum(skills_type)` to `client.pins.update()`.
- Added `response.pin.attribution.related_documents[].query_suggestion.ranges[].document.metadata.collections[].items[].shortcut.favorite_info.ugc_type.enum(skills_type)` to `client.pins.retrieve()`.
- Added `response.pins[].attribution.related_documents[].query_suggestion.ranges[].document.metadata.collections[].items[].shortcut.favorite_info.ugc_type.enum(skills_type)` to `client.pins.list()`.
- Added `response.attribution.related_documents[].query_suggestion.ranges[].document.metadata.collections[].items[].shortcut.favorite_info.ugc_type.enum(skills_type)` to `client.pins.create()`.
- Added `request.source_document.metadata.author.related_documents[].results[].structured_results[].answer.collections[].items[].shortcut.favorite_info.ugc_type.enum(skills_type)` to `client.search.query_as_admin()`.
- Added `response.results[].structured_results[].document.metadata.pins[].favorite_info.ugc_type.enum(skills_type)` to `client.search.query_as_admin()`.
- Added `response.results[].document.metadata.author.related_documents[].results[].structured_results[].answer.collections[].items[].shortcut.favorite_info.ugc_type.enum(skills_type)` to `client.search.autocomplete()`.
- Added `response.results[].primary_entry.created_by.related_documents[].query_suggestion.ranges[].document.metadata.pins[].favorite_info.ugc_type.enum(skills_type)` to `client.search.retrieve_feed()`.
- Added `request.source_document.metadata.author.related_documents[].results[].structured_results[].answer.collections[].items[].shortcut.favorite_info.ugc_type.enum(skills_type)` to `client.search.recommendations()`.
- Added `response.results[].structured_results[].document.metadata.pins[].favorite_info.ugc_type.enum(skills_type)` to `client.search.recommendations()`.
- Added `request.source_document.metadata.author.related_documents[].results[].structured_results[].answer.collections[].items[].shortcut.favorite_info.ugc_type.enum(skills_type)` to `client.search.query()`.
- Added `response.results[].structured_results[].document.metadata.pins[].favorite_info.ugc_type.enum(skills_type)` to `client.search.query()`.
- Added `response.results[].related_documents[].query_suggestion.ranges[].document.metadata.pins[].favorite_info.ugc_type.enum(skills_type)` to `client.entities.list()`.
- Added `response.results[].related_documents[].query_suggestion.ranges[].document.metadata.pins[].favorite_info.ugc_type.enum(skills_type)` to `client.entities.read_people()`.
- Added `request.data.added_roles[].person.related_documents[].query_suggestion.ranges[].document.metadata.pins[].favorite_info.ugc_type.enum(skills_type)` to `client.shortcuts.create()`.
- Added `response.shortcut.added_roles[].person.related_documents[].query_suggestion.ranges[].document.metadata.pins[].favorite_info.ugc_type.enum(skills_type)` to `client.shortcuts.create()`.
- Added `response.shortcut.added_roles[].person.related_documents[].query_suggestion.ranges[].document.metadata.pins[].favorite_info.ugc_type.enum(skills_type)` to `client.shortcuts.retrieve()`.
- Added `response.shortcuts[].added_roles[].person.related_documents[].query_suggestion.ranges[].document.metadata.pins[].favorite_info.ugc_type.enum(skills_type)` to `client.shortcuts.list()`.
- Added `request.added_roles[].person.related_documents[].query_suggestion.ranges[].document.metadata.pins[].favorite_info.ugc_type.enum(skills_type)` to `client.shortcuts.update()`.
- Added `response.shortcut.added_roles[].person.related_documents[].query_suggestion.ranges[].document.metadata.pins[].favorite_info.ugc_type.enum(skills_type)` to `client.shortcuts.update()`.
- Added `response.metadata.last_verifier.related_documents[].query_suggestion.ranges[].document.metadata.pins[].favorite_info.ugc_type.enum(skills_type)` to `client.verification.add_reminder()`.
- Added `response.documents[].metadata.last_verifier.related_documents[].query_suggestion.ranges[].document.metadata.pins[].favorite_info.ugc_type.enum(skills_type)` to `client.verification.list()`.
- Added `response.metadata.last_verifier.related_documents[].query_suggestion.ranges[].document.metadata.pins[].favorite_info.ugc_type.enum(skills_type)` to `client.verification.verify()`.

## Source

- [Release notes](https://github.com/gleanwork/api-client-python/releases/tag/v0.17.2)
