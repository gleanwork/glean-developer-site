# Abstract Interface: GuestAuthProvider

Creates and manages auth tokens for guest users.
Used primarily in Glean external search deployments

## Properties

### createAuthToken

```ts
createAuthToken: () => Promise<AuthTokenDetails>;
```

Creates a new guest auth token and returns the same

#### Returns

`Promise`\<[`AuthTokenDetails`](AuthTokenDetails.md)\>

***

### getAuthToken

```ts
getAuthToken: () => Promise<AuthTokenDetails>;
```

Retrieves a stored guest auth token if it exists.
If no token exists, a new guest auth token is created.

#### Returns

`Promise`\<[`AuthTokenDetails`](AuthTokenDetails.md)\>
