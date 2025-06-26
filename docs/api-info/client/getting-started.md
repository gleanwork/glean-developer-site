---
title: 'Getting Started'
icon: 'send-backward'
---

# Overview

The Glean Client API lets organizations build custom apps and interfaces that harness Glean’s search and generative AI. It exposes key functionality—like search, chat, document retrieval, and analytics—while enforcing Glean’s permission model for secure, permissions-aware access. The API supports embedding Glean-powered experiences into internal tools or creating tailored workflows using SDKs for languages like Python, Java, NodeJS, and Go. Authentication uses OAuth or Glean-issued tokens with granular scopes for strong governance. Glean provides advance notice and a deprecation period for any backwards-incompatible changes.

# Making Requests

Kindly read the [Authentication](./authentication/glean-issued) page to know about the host url, token generation, token permissions and scopes before moving to further sections.

Let's walk through some sample requests to get familiar with the general usage of the developer-ready endpoints!

<Note>
  For the sake of the example, we shall demonstrate the usage of the
  [/createcollection](https://developers.glean.com/api-reference/client/collections/create-collection)
  developer-ready endpoint. To find out more about a specific endpoint's fields
  and usage, please refer to its API reference page!
</Note>

## Using a User-Scoped Token

<Steps>
<Step title="Ensuring accurate token information">
- The permissions for the token should be set to `USER`, the user email should be set to a valid user email (say, `john.doe@yourdomain.com`) while creating the token.
- The scope list for the token should contain the `COLLECTIONS` scope.
</Step>

<Step title="Making the request">
Use the following cURL command to create a collection.

```bash
curl -X POST https://customer-be.glean.com/rest/api/v1/createcollection \
-H 'Authorization: Bearer <token>' \
-d '{
     "name": "Sample Collection - '$(date +"%Y-%m-%d %H:%M:%S")'",
     "description": "A brief summary of the collection\'s contents."
}'
```

<Warning>
If you get a response with a status code other that `200`, use the error response to figure out what might have gone wrong. For example, the token may have expired, causing the request to fail.
</Warning>
</Step>

<Step title="Verifying the collection">
Go to the [Collections tab](https://app.glean.com/knowledge/collections) to verify that your collection has been created! Don't forget to delete the test collection once you're done!

![collection_creation_success.png](https://user-images.githubusercontent.com/109058340/233598765-7982662c-e4cf-4727-ae06-92fc1b041ab4.png)

<Tip>
As seen in the screenshot below, the email provided was identical to that of the user-logged in. If that is not the case, the `Created By` field will reflect the appropriate creator, based on the inferred email.
</Tip>
</Step>
</Steps>

## Using a Global Token

<Steps>
<Step title="Ensuring accurate token information">
- The permissions for the token should be set to `GLOBAL`
- The user email would not be set.
- The scope list for the token should contain the `COLLECTIONS` scope.
</Step>

<Step title="Making the request">

- Use the following cURL command to create a collection
- Replace `<User email>` in the `X-Glean-ActAs` header with a valid email address of a user on whose behalf the request is intended to be made.

```bash cURL
curl -X POST https://customer-be.glean.com/rest/api/v1/createcollection \
-H 'Authorization: Bearer <token>' \
-H 'X-Glean-ActAs: <User email>' \
-d '{
     "name": "Sample Collection - '$(date +"%Y-%m-%d %H:%M:%S")'",
     "description": "A brief summary of the collection\'s contents."
}'
```

<Warning>
If you get a response with a status code other that `200`, use the error response to figure out what might have gone wrong. For example, the token may have expired, causing the request to fail.

If the `X-Glean-ActAs` header is not specified or blank, the request will fail with a `400: Required header missing: X-Glean-ActAs` error.

If the `X-Glean-ActAs` header is specified with an invalid email, the request will fail with a `401: Invalid identity` error.

</Warning>
</Step>

<Step title="Verifying the collection">

- Go to the [Collections tab](https://app.glean.com/knowledge/collections) to verify that your collection has been created! Don't forget to delete the test collection once you're done!

![collection_creation_success.png](https://user-images.githubusercontent.com/109058340/233598765-7982662c-e4cf-4727-ae06-92fc1b041ab4.png)

<Tip>
As seen in the screenshot below, the email provided was identical to that of the user-logged in. If that is not the case, the `Created By` field will reflect the appropriate creator, based on the inferred email.
</Tip>
</Step>
</Steps>
