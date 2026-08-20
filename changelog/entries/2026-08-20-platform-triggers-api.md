---
title: 'Platform Triggers API (Experimental)'
categories: ['API']
---

The Platform Triggers API is now documented as an experimental release — subscribe to content events in Glean and receive them at your own endpoint as signed webhooks, instead of polling for changes.

{/* truncate */}

## Changes

- Added endpoints: `GET /api/trigger-presets`, `GET /api/trigger-presets/{preset_id}`, `GET /api/trigger-presets/{preset_id}/input-values`.
- Added endpoints: `POST /api/triggers`, `GET /api/triggers`, `GET /api/triggers/{trigger_id}`, `PATCH /api/triggers/{trigger_id}`, `DELETE /api/triggers/{trigger_id}`.
- Added endpoints: `POST /api/trigger-presets/{preset_id}/events/search`, `POST /api/triggers/{trigger_id}/events/search` — preview what a preset would match, or search recent events a trigger's current configuration matches.
- Triggers are created from **presets**: curated event definitions per datasource, each declaring the inputs it accepts, discoverable at runtime.
- Events arrive as [Standard Webhooks](https://www.standardwebhooks.com), signed with HMAC-SHA256. The signing secret is returned once, at creation. Delivery is at least once, and `webhook-id` is stable across retries.
- `delivery.auth` attaches a bearer token sent alongside the signature, not instead of it.
- Events are scoped to what the subscribing user is permitted to see.

## Experimental

These endpoints are experimental. Send `X-Glean-Include-Experimental: true` or they are not exposed. They may change or be removed without notice, and the standard API lifecycle guarantees do not apply. See [Experimental APIs](/experimental/overview).

## Documentation

- [Triggers API overview](/api/platform-api/triggers-overview)
- [List trigger presets](/api/platform-api/platform-trigger-presets-list)
- [Create trigger](/api/platform-api/platform-triggers-create)
