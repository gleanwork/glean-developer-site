---
title: 'Authentication'
description: 'Explains the authentication options for the Web SDK.'
icon: cookie
---

## Authentication

:::note
  Authentication involves two default steps that users must complete upon first
  usage. However, both steps can be optimized for a smoother user experience.
:::

### Default Authentication Flow

1. Email Address Entry
2. SSO Authentication

### Optimizing Authentication

You can streamline the authentication process in two ways:

1. **Skip Email Entry**: Implement the [backend](https://app.glean.com/meta/browser_api/interfaces/SearchOptions.html#backend) parameter to bypass the email entry step.

2. **Skip SSO Authentication**: Configure a [server-to-server handshake](https://docs.google.com/document/d/12q1oQWwhkLQyIHXKE7OF6XtvJZ5av50Wd_NKUbRh5u4/edit) and provide the user's auth token via [Options.authToken](https://app.glean.com/meta/browser_api/interfaces/Options.html#authToken).

:::warning
  When implementing auth token authentication:
  - You must configure an [onAuthTokenRequired](https://app.glean.com/meta/browser_api/interfaces/Options.html#onAuthTokenRequired) callback
  - This callback handles token refresh when expiration approaches
  - Server-to-server authentication becomes mandatory if [third-party cookies](./3rd-party-cookies]) are
  blocked in the user's browser
:::
