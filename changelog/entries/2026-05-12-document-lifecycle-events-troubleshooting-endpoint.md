---
title: 'Beta: Document Lifecycle Events Troubleshooting Endpoint'
categories: ['API']
---

New endpoint `/debug/{datasource}/document/events` (beta) introduced to retrieve lifecycle events (upload, index, deletion requested, deletion) for a specific document.

{/* truncate */}

## Changes

- Added endpoint `/debug/{datasource}/document/events` (beta) to retrieve lifecycle events for a specific document.
  - Request requires `objectType` and `docId`; optional `startDate` (up to 30 days back, defaults to 7) and `maxEvents` (up to 100, defaults to 20).
  - Response returns `lifeCycleEvents`, each with an `event` (`UPLOADED`, `INDEXED`, `DELETION_REQUESTED`, or `DELETED`) and a `timestamp`.
  - Rate limited to 1 request per minute per datasource.
