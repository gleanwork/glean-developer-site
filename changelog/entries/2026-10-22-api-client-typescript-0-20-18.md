---
title: 'api-client-typescript v0.20.18'
categories: ['API Clients']
---

Api-client-typescript v0.20.18 includes 4 breaking removals, 2 additions, 1 change.

{/* truncate */}

## Action Required

- Update callers of `admin.idpgroups.list()` to stop using `response.results[].isActive`.
- Update callers of `users.list()` to stop using `response.results[].isActive`.
- Update callers of `departments.list()` to stop using `request.filters`.
- Update callers of `departments.list()` to stop using `response.results[].isActive`.

## Changes

- Added `request.listCollectionsRequest.query` to `client.collections.list()`.
- Added `request.feedRequest.categories[].enum(discover)` to `client.search.retrievefeed()`.
- Changed `response.results[]` on `client.search.retrievefeed()`.

## Breaking Changes

- Removed `response.results[].isActive` from `admin.idpgroups.list()`.
- Removed `response.results[].isActive` from `users.list()`.
- Removed `request.filters` from `departments.list()`.
- Removed `response.results[].isActive` from `departments.list()`.

## Source

- [Release notes](https://github.com/gleanwork/api-client-typescript/releases/tag/v0.20.18)
