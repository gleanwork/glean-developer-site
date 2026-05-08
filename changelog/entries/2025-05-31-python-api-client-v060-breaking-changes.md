---
title: 'Python API Client v0.6.0 - Breaking Changes'
categories: ['SDK']
---

The Python API client now uses a namespaced package structure. All imports must be updated from `glean` to `glean.api_client`.

{/* truncate */}

## Action Required

- Update imports to use the new paths.

## Changes

- Import paths have changed from `from glean import ...` to `from glean.api_client import ...`.
- This affects all classes including `Glean`, `models`, and other API components.
- `from glean import` → `from glean.api_client import`.
- `from glean.` (but not glean.api_client) → `from glean.api_client.`.
- This change affects all Python API client users.
- No functional changes to the API itself - only import paths.
- Ensure you're using the latest version of the Python API client package.
