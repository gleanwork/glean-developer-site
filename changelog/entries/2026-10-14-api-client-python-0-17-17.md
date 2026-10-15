---
title: 'api-client-python v0.17.17'
categories: ['API Clients']
---

Api-client-python v0.17.17 includes 59 additions, 1 change.

{/* truncate */}

## Changes

- Added `response.results[].reason.enum(webhook_created)` to `triggers.search_events()`.
- Added `response.results[].reason.enum(webhook_created)` to `triggers.search_preset_events()`.
- Added `request.body.structured_list[].document.metadata.author.metadata.social_network[].icon_url` to `client.announcements.create()`.
- Added `response.body.structured_list[].document.metadata.author.metadata.social_network[].icon_url` to `client.announcements.create()`.
- Added `request.body.structured_list[].document.metadata.author.metadata.social_network[].icon_url` to `client.announcements.update()`.
- Added `response.body.structured_list[].document.metadata.author.metadata.social_network[].icon_url` to `client.announcements.update()`.
- Added `request.data.added_roles[].person.metadata.social_network[].icon_url` to `client.answers.create()`.
- Added `response.added_roles[].person.metadata.social_network[].icon_url` to `client.answers.create()`.
- Added `request.added_roles[].person.metadata.social_network[].icon_url` to `client.answers.update()`.
- Added `response.added_roles[].person.metadata.social_network[].icon_url` to `client.answers.update()`.
- Added `response.answer_result.answer.added_roles[].person.metadata.social_network[].icon_url` to `client.answers.retrieve()`.
- Added `response.answer_results[].answer.added_roles[].person.metadata.social_network[].icon_url` to `client.answers.list()`.
- Added `request.messages[].citations[].source_document.metadata.author.metadata.social_network[].icon_url` to `client.chat.create()`.
- Added `response.messages[].citations[].source_document.metadata.author.metadata.social_network[].icon_url` to `client.chat.create()`.
- Added `response.chat_result.chat.created_by.metadata.social_network[].icon_url` to `client.chat.retrieve()`.
- Added `error.created_by.metadata.social_network[].icon_url` to `client.chat.retrieve()`.
- Added `response.chat_results[].chat.created_by.metadata.social_network[].icon_url` to `client.chat.list()`.
- Added `request.messages[].citations[].source_document.metadata.author.metadata.social_network[].icon_url` to `client.chat.create_stream()`.
- Added `response.workflow.author.metadata.social_network[].icon_url` to `client.agents.create()`.
- Added `response.workflow_result.workflow.author.metadata.social_network[].icon_url` to `client.agents.import()`.
- Added `response.collection.added_roles[].person.metadata.social_network[].icon_url` to `client.collections.add_items()`.
- Added `request.added_roles[].person.metadata.social_network[].icon_url` to `client.collections.create()`.
- Added `response.union(class (0)).collection.added_roles[].person.metadata.social_network[].icon_url` to `client.collections.create()`.
- Added `response.collection.added_roles[].person.metadata.social_network[].icon_url` to `client.collections.delete_item()`.
- Added `request.added_roles[].person.metadata.social_network[].icon_url` to `client.collections.update()`.
- Added `response.added_roles[].person.metadata.social_network[].icon_url` to `client.collections.update()`.
- Added `response.collection.added_roles[].person.metadata.social_network[].icon_url` to `client.collections.update_item()`.
- Added `response.collection.added_roles[].person.metadata.social_network[].icon_url` to `client.collections.retrieve()`.
- Added `response.collections[].added_roles[].person.metadata.social_network[].icon_url` to `client.collections.list()`.
- Added `response.documents.Map<DocumentOrError>.union(Document).metadata.author.metadata.social_network[].icon_url` to `client.documents.retrieve()`.
- Added `response.documents[].metadata.author.metadata.social_network[].icon_url` to `client.documents.retrieve_by_facets()`.
- Added `response.glean_assist.activity_insights[].user.metadata.social_network[].icon_url` to `client.insights.retrieve()`.
- Added `response.search_response.results[].structured_results[].document.metadata.author.metadata.social_network[].icon_url` to `client.messages.retrieve()`.
- Added `response.attribution.metadata.social_network[].icon_url` to `client.pins.update()`.
- Added `response.pin.attribution.metadata.social_network[].icon_url` to `client.pins.retrieve()`.
- Added `response.pins[].attribution.metadata.social_network[].icon_url` to `client.pins.list()`.
- Added `response.attribution.metadata.social_network[].icon_url` to `client.pins.create()`.
- Added `request.source_document.metadata.author.metadata.social_network[].icon_url` to `client.search.query_as_admin()`.
- Added `response.results[].structured_results[].document.metadata.author.metadata.social_network[].icon_url` to `client.search.query_as_admin()`.
- Added `response.results[].document.metadata.author.metadata.social_network[].icon_url` to `client.search.autocomplete()`.
- Added `request.categories[].enum(zero_state_glean_agent_coworkers)` to `client.search.retrieve_feed()`.
- Added `request.source_document.metadata.author.metadata.social_network[].icon_url` to `client.search.recommendations()`.
- Added `response.results[].structured_results[].document.metadata.author.metadata.social_network[].icon_url` to `client.search.recommendations()`.
- Added `request.source_document.metadata.author.metadata.social_network[].icon_url` to `client.search.query()`.
- Added `response.results[].structured_results[].document.metadata.author.metadata.social_network[].icon_url` to `client.search.query()`.
- Added `response.results[].metadata.social_network[].icon_url` to `client.entities.list()`.
- Added `response.results[].metadata.social_network[].icon_url` to `client.entities.read_people()`.
- Added `request.data.added_roles[].person.metadata.social_network[].icon_url` to `client.shortcuts.create()`.
- Added `response.shortcut.added_roles[].person.metadata.social_network[].icon_url` to `client.shortcuts.create()`.
- Added `response.shortcut.added_roles[].person.metadata.social_network[].icon_url` to `client.shortcuts.retrieve()`.
- Added `response.shortcuts[].added_roles[].person.metadata.social_network[].icon_url` to `client.shortcuts.list()`.
- Added `request.added_roles[].person.metadata.social_network[].icon_url` to `client.shortcuts.update()`.
- Added `response.shortcut.added_roles[].person.metadata.social_network[].icon_url` to `client.shortcuts.update()`.
- Added `response.metadata.last_verifier.metadata.social_network[].icon_url` to `client.verification.add_reminder()`.
- Added `response.documents[].metadata.last_verifier.metadata.social_network[].icon_url` to `client.verification.list()`.
- Added `response.metadata.last_verifier.metadata.social_network[].icon_url` to `client.verification.verify()`.
- Added `request.export_type.enum(findings_csv)` to `client.governance.data.findings.create()`.
- Added `response.export_type.enum(findings_csv)` to `client.governance.data.findings.create()`.
- Added `response.exports[].export_type.enum(findings_csv)` to `client.governance.data.findings.list()`.
- Changed `response.results[]` on `client.search.retrieve_feed()`.

## Source

- [Release notes](https://github.com/gleanwork/api-client-python/releases/tag/v0.17.17)
