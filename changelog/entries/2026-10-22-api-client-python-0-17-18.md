---
title: 'api-client-python v0.17.18'
categories: ['API Clients']
---

Api-client-python v0.17.18 includes 4 breaking removals, 2 additions, 1 change.

{/* truncate */}

## Action Required

- Update callers of `admin.idpgroups.list()` to stop using `response.results[].is_active`.
- Update callers of `users.list()` to stop using `response.results[].is_active`.
- Update callers of `departments.list()` to stop using `request.filters`.
- Update callers of `departments.list()` to stop using `response.results[].is_active`.

## Changes

- Added `request.query` to `client.collections.list()`.
- Added `request.categories[].enum(discover)` to `client.search.retrieve_feed()`.
- Changed `response.results[]` on `client.search.retrieve_feed()`.

## Breaking Changes

- Removed `response.results[].is_active` from `admin.idpgroups.list()`.
- Removed `response.results[].is_active` from `users.list()`.
- Removed `request.filters` from `departments.list()`.
- Removed `response.results[].is_active` from `departments.list()`.

## Source

- [Release notes](https://github.com/gleanwork/api-client-python/releases/tag/v0.17.18)
