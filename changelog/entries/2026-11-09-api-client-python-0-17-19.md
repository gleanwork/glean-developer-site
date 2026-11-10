---
title: 'api-client-python v0.17.19'
categories: ['API Clients']
---

Api-client-python v0.17.19 includes 55 additions, 6 changes.

{/* truncate */}

## Action Required

- Review OAuth configuration before upgrading.

## Changes

- Added `error.code.enum(unsupported_action_target)` to `admin.oauth.clients.list()`.
- Added `error.code.enum(unsupported_action_target)` to `admin.oauth.clients.get()`.
- Added `error.code.enum(unsupported_action_target)` to `admin.agents.list()`.
- Added `error.code.enum(unsupported_action_target)` to `agents.search()`.
- Added `error.code.enum(unsupported_action_target)` to `agents.get()`.
- Added `error.code.enum(unsupported_action_target)` to `agents.get_schemas()`.
- Added `error.code.enum(unsupported_action_target)` to `agents.create_run()`.
- Added `error.code.enum(unsupported_action_target)` to `agents.get_run()`.
- Added `error.code.enum(unsupported_action_target)` to `agents.cancel_run()`.
- Added `error.code.enum(unsupported_action_target)` to `agents.respond_to_run()`.
- Added `error.code.enum(unsupported_action_target)` to `chat.create()`.
- Added `error.code.enum(unsupported_action_target)` to `chat.update()`.
- Added `error.code.enum(unsupported_action_target)` to `chat.create_stream()`.
- Added `error.code.enum(unsupported_action_target)` to `skills.create()`.
- Added `error.code.enum(unsupported_action_target)` to `skills.list()`.
- Added `error.code.enum(unsupported_action_target)` to `skills.import()`.
- Added `error.code.enum(unsupported_action_target)` to `skills.validate()`.
- Added `error.code.enum(unsupported_action_target)` to `skills.preview_source()`.
- Added `error.code.enum(unsupported_action_target)` to `skills.update()`.
- Added `error.code.enum(unsupported_action_target)` to `skills.delete()`.
- Added `error.code.enum(unsupported_action_target)` to `skills.retrieve()`.
- Added `error.code.enum(unsupported_action_target)` to `skills.retrieve_content()`.
- Added `error.code.enum(unsupported_action_target)` to `skills.sync()`.
- Added `response.version.updated_by` to `skills.create_version()`.
- Added `error.code.enum(unsupported_action_target)` to `skills.create_version()`.
- Added `response.results[].updated_by` to `skills.list_versions()`.
- Added `error.code.enum(unsupported_action_target)` to `skills.list_versions()`.
- Added `response.version.updated_by` to `skills.retrieve_version()`.
- Added `error.code.enum(unsupported_action_target)` to `skills.retrieve_version()`.
- Added `error.code.enum(unsupported_action_target)` to `skills.retrieve_version_content()`.
- Added `response.[].union(ERROR).data.error.code.enum(unsupported_action_target)` to `skills.preview_source_stream()`.
- Added `error.code.enum(unsupported_action_target)` to `skills.preview_source_stream()`.
- Added `error.code.enum(unsupported_action_target)` to `search.query()`.
- Added `error.code.enum(unsupported_action_target)` to `search.list_filters()`.
- Added `error.code.enum(unsupported_action_target)` to `admin.idpgroups.list()`.
- Added `error.code.enum(unsupported_action_target)` to `admin.idpgroups.get()`.
- Added `request.filters` to `departments.list()`.
- Added `error.code.enum(unsupported_action_target)` to `departments.list()`.
- Added `error.code.enum(unsupported_action_target)` to `departments.get()`.
- Added `error.code.enum(unsupported_action_target)` to `users.list()`.
- Added `error.code.enum(unsupported_action_target)` to `users.get()`.
- Added `error.code.enum(unsupported_action_target)` to `triggers.create()`.
- Added `error.code.enum(unsupported_action_target)` to `triggers.list()`.
- Added `error.code.enum(unsupported_action_target)` to `triggers.get()`.
- Added `error.code.enum(unsupported_action_target)` to `triggers.update()`.
- Added `error.code.enum(unsupported_action_target)` to `triggers.delete()`.
- Added `error.code.enum(unsupported_action_target)` to `triggers.search_events()`.
- Added `error.code.enum(unsupported_action_target)` to `triggers.list_presets()`.
- Added `error.code.enum(unsupported_action_target)` to `triggers.get_preset()`.
- Added `error.code.enum(unsupported_action_target)` to `triggers.list_preset_input_values()`.
- Added `error.code.enum(unsupported_action_target)` to `triggers.search_preset_events()`.
- Added `response.pagination` to `client.chat.retrieve()`.
- Added `request.categories[].enum(personal_agent_nux)` to `client.search.retrieve_feed()`.
- Added `request.object_definitions[].doc_category.enum(ugc_skill)` to `indexing.datasources.add()`.
- Added `response.object_definitions[].doc_category.enum(ugc_skill)` to `indexing.datasources.retrieve_config()`.
- Changed `response.results[]` on `admin.oauth.clients.list()`.
- Changed `response.client` on `admin.oauth.clients.get()`.
- Changed `response.results[]` on `admin.agents.list()`.
- Changed `request` on `client.chat.retrieve()`.
- Changed `response.run.messages[]` on `client.agents.run()`.
- Changed `response.results[]` on `client.search.retrieve_feed()`.

## Source

- [Release notes](https://github.com/gleanwork/api-client-python/releases/tag/v0.17.19)
