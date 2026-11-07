---
title: 'api-client-typescript v0.20.19'
categories: ['API Clients']
---

Api-client-typescript v0.20.19 includes 55 additions, 6 changes.

{/* truncate */}

## Action Required

- Review OAuth configuration before upgrading.

## Changes

- Added `error.code.enum(unsupportedActionTarget)` to `admin.oauth.clients.list()`.
- Added `error.code.enum(unsupportedActionTarget)` to `admin.oauth.clients.get()`.
- Added `error.code.enum(unsupportedActionTarget)` to `admin.agents.list()`.
- Added `error.code.enum(unsupportedActionTarget)` to `agents.search()`.
- Added `error.code.enum(unsupportedActionTarget)` to `agents.get()`.
- Added `error.code.enum(unsupportedActionTarget)` to `agents.getschemas()`.
- Added `error.code.enum(unsupportedActionTarget)` to `agents.createrun()`.
- Added `error.code.enum(unsupportedActionTarget)` to `agents.getrun()`.
- Added `error.code.enum(unsupportedActionTarget)` to `agents.cancelrun()`.
- Added `error.code.enum(unsupportedActionTarget)` to `agents.respondtorun()`.
- Added `error.code.enum(unsupportedActionTarget)` to `chat.create()`.
- Added `error.code.enum(unsupportedActionTarget)` to `chat.update()`.
- Added `error.code.enum(unsupportedActionTarget)` to `chat.createstream()`.
- Added `error.code.enum(unsupportedActionTarget)` to `skills.create()`.
- Added `error.code.enum(unsupportedActionTarget)` to `skills.list()`.
- Added `error.code.enum(unsupportedActionTarget)` to `skills.import()`.
- Added `error.code.enum(unsupportedActionTarget)` to `skills.validate()`.
- Added `error.code.enum(unsupportedActionTarget)` to `skills.previewsource()`.
- Added `error.code.enum(unsupportedActionTarget)` to `skills.update()`.
- Added `error.code.enum(unsupportedActionTarget)` to `skills.delete()`.
- Added `error.code.enum(unsupportedActionTarget)` to `skills.retrieve()`.
- Added `error.code.enum(unsupportedActionTarget)` to `skills.retrievecontent()`.
- Added `error.code.enum(unsupportedActionTarget)` to `skills.sync()`.
- Added `response.version.updatedBy` to `skills.createversion()`.
- Added `error.code.enum(unsupportedActionTarget)` to `skills.createversion()`.
- Added `response.results[].updatedBy` to `skills.listversions()`.
- Added `error.code.enum(unsupportedActionTarget)` to `skills.listversions()`.
- Added `response.version.updatedBy` to `skills.retrieveversion()`.
- Added `error.code.enum(unsupportedActionTarget)` to `skills.retrieveversion()`.
- Added `error.code.enum(unsupportedActionTarget)` to `skills.retrieveversioncontent()`.
- Added `response.[].union(ERROR).data.error.code.enum(unsupportedActionTarget)` to `skills.previewsourcestream()`.
- Added `error.code.enum(unsupportedActionTarget)` to `skills.previewsourcestream()`.
- Added `error.code.enum(unsupportedActionTarget)` to `search.query()`.
- Added `error.code.enum(unsupportedActionTarget)` to `search.listfilters()`.
- Added `error.code.enum(unsupportedActionTarget)` to `admin.idpgroups.list()`.
- Added `error.code.enum(unsupportedActionTarget)` to `admin.idpgroups.get()`.
- Added `request.filters` to `departments.list()`.
- Added `error.code.enum(unsupportedActionTarget)` to `departments.list()`.
- Added `error.code.enum(unsupportedActionTarget)` to `departments.get()`.
- Added `error.code.enum(unsupportedActionTarget)` to `users.list()`.
- Added `error.code.enum(unsupportedActionTarget)` to `users.get()`.
- Added `error.code.enum(unsupportedActionTarget)` to `triggers.create()`.
- Added `error.code.enum(unsupportedActionTarget)` to `triggers.list()`.
- Added `error.code.enum(unsupportedActionTarget)` to `triggers.get()`.
- Added `error.code.enum(unsupportedActionTarget)` to `triggers.update()`.
- Added `error.code.enum(unsupportedActionTarget)` to `triggers.delete()`.
- Added `error.code.enum(unsupportedActionTarget)` to `triggers.searchevents()`.
- Added `error.code.enum(unsupportedActionTarget)` to `triggers.listpresets()`.
- Added `error.code.enum(unsupportedActionTarget)` to `triggers.getpreset()`.
- Added `error.code.enum(unsupportedActionTarget)` to `triggers.listpresetinputvalues()`.
- Added `error.code.enum(unsupportedActionTarget)` to `triggers.searchpresetevents()`.
- Added `response.pagination` to `client.chat.retrieve()`.
- Added `request.feedRequest.categories[].enum(personalAgentNux)` to `client.search.retrievefeed()`.
- Added `request.objectDefinitions[].docCategory.enum(ugcSkill)` to `indexing.datasources.add()`.
- Added `response.objectDefinitions[].docCategory.enum(ugcSkill)` to `indexing.datasources.retrieveconfig()`.
- Changed `response.results[]` on `admin.oauth.clients.list()`.
- Changed `response.client` on `admin.oauth.clients.get()`.
- Changed `response.results[]` on `admin.agents.list()`.
- Changed `request.getChatRequest` on `client.chat.retrieve()`.
- Changed `response.run.messages[]` on `client.agents.run()`.
- Changed `response.results[]` on `client.search.retrievefeed()`.

## Source

- [Release notes](https://github.com/gleanwork/api-client-typescript/releases/tag/v0.20.19)
