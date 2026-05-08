---
title: 'REST API: changes (endpoints) 2025-10-01'
categories: ['API']
---

Breaking: 2 endpoints added, 3 endpoints removed.

{/* truncate */}

## Action Required

- Update callers to stop using /debug/{datasource}/document/events.
- Update callers to stop using /update/{datasource}/extenddeletionpaused.
- Update callers to stop using /update/{datasource}/resolvedeletionpaused.

## Changes

- Added endpoint: /update/{datasource}/extenddeletionpaused.
- Added endpoint: /update/{datasource}/resolvedeletionpaused.

## Breaking Changes

- Breaking: 2 endpoints added, 3 endpoints removed.
- Removed endpoint: /debug/{datasource}/document/events.
- Removed endpoint: /update/{datasource}/extenddeletionpaused.
- Removed endpoint: /update/{datasource}/resolvedeletionpaused.
