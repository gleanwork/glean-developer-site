---
title: 'Debug Endpoints Permission Status'
categories: ['API']
---

`/debug/{datasource}/document` - New response field `permissionIdentityStatus` under `status`: Provides information regarding upload status of users and groups specified in document permissions.

{/* truncate */}

## Changes

- `/debug/{datasource}/document` - New response field `permissionIdentityStatus` under `status`: Provides information regarding upload status of users and groups specified in document permissions.
- `/debug/{datasource}/documents` - New response field `permissionIdentityStatus` under `status`: Provides information regarding upload status of users and groups specified in document permissions.
