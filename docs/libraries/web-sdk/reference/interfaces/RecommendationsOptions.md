# RecommendationsOptions

## Extends

- [`Options`](Options.md).[`RecommendationsSearchOptions`](RecommendationsSearchOptions.md).[`RecommendationsResultsOptions`](RecommendationsResultsOptions.md)

## Properties

### authMethod?

```ts
optional authMethod?: "sso" | "token";
```

The authentication method to use in the embedded widget.

sso - Logged out users will see a login button in the embedded widget. Clicking
 the button will open the SSO login flow in a new window.

token - The embedding page obtains an auth token on behalf of the user and passes
 it to the embedded widget. If this method is specified the [Options.authToken](Options.md#authtoken) and
 [Options.onAuthTokenRequired](Options.md#onauthtokenrequired) options must also be specified.

#### Inherited from

[`Options`](Options.md).[`authMethod`](Options.md#authmethod)

***

### authToken?

```ts
optional authToken?: AuthTokenDetails;
```

An authentication token for the user. Providing this obviates the need for
the user to separately login to Glean. May be obtained via:
https://developers.glean.com/api/client-api/authentication/createauthtoken

If an authToken is provided, [Options.onAuthTokenRequired](Options.md#onauthtokenrequired) must also
be provided.

#### Inherited from

[`Options`](Options.md).[`authToken`](Options.md#authtoken)

***

### backend?

```ts
optional backend?: string;
```

Overrides the search backend server to use.

Setting this explicitly is always recommended as it alleviates the user from
from having to manually enter their email address in order to route to the
backend instance to log into.

It's also useful for routing users to a production vs staging server (if available).

Example: `https://{your}-be.glean.com/`

#### Inherited from

[`Options`](Options.md).[`backend`](Options.md#backend)

***

### customizations?

```ts
optional customizations?: RecommendationsBoxCustomizations;
```

Optional styling of the widget box. When adding boxShadow, border provide
enough margin so they are visible

***

### datasource?

```ts
optional datasource?: string;
```

Select the search tab for the given datasource (e.g. `'confluence'`, `'gdrive'`,
`'people'`) instead of the all tab. Other datasource tabs will be shown if
results are available for the current query. See also [SearchOptions.datasourcesFilter](SearchOptions.md#datasourcesfilter).

#### Inherited from

[`SearchOptions`](SearchOptions.md).[`datasource`](SearchOptions.md#datasource)

***

### datasourcesFilter?

```ts
optional datasourcesFilter?: string[];
```

Filter search results to only the given list of datasources (e.g. `['figma']`, `['jira',
'zendesk']`). Results from other datasources will not be available. See also
[SearchOptions.datasource](SearchOptions.md#datasource).

#### Inherited from

[`SearchOptions`](SearchOptions.md).[`datasourcesFilter`](SearchOptions.md#datasourcesfilter)

***

### disableAnalytics?

```ts
optional disableAnalytics?: boolean;
```

If true, Glean will not collect client analytics or log activity for the embedded session.

Analytics data is used to monitor and improve the product experience, so it's recommended
to leave data collection on unless the user has specifically requested otherwise.

#### Inherited from

[`Options`](Options.md).[`disableAnalytics`](Options.md#disableanalytics)

***

### disableAssistant?

```ts
optional disableAssistant?: boolean;
```

If true, Glean Assistant will not be enabled for the embedded session, including but not limited to
generated answers, summaries, chat, and other features.

#### Inherited from

[`Options`](Options.md).[`disableAssistant`](Options.md#disableassistant)

***

### domainsToOpenInCurrentTab?

```ts
optional domainsToOpenInCurrentTab?: string[];
```

Always open links from these domains in the current tab.

Expects a list of one or more domain suffixes, e.g. `['example.com', 'foo.example.org']`.

#### Inherited from

[`Options`](Options.md).[`domainsToOpenInCurrentTab`](Options.md#domainstoopenincurrenttab)

***

### enable3PCookieAccessRequest?

```ts
optional enable3PCookieAccessRequest?: boolean;
```

Enable flow to request the user for access if third-party cookies are blocked.
If true, the user will be prompted to allow cookie access for glean.com when they
try to login.

Default to true since api version >= 2025-06-19.

Note: This flag will have no impact if third-party cookies are already allowed. Users will be able
to login as usual.

Refer to [Guide to third-party cookies in Glean](https://developers.glean.com/docs/browser_api/third_party_cookies/)
for more details.

#### Inherited from

[`Options`](Options.md).[`enable3PCookieAccessRequest`](Options.md#enable3pcookieaccessrequest)

***

### enableActivityLogging?

```ts
optional enableActivityLogging?: boolean;
```

Logs an activity event for each URL change of the embedding page.

This improves search quality when embedded within a datasource for
which there are not other activity signals (e.g. Salesforce).

Note: if disableAnalytics is true, activity logging will be disabled
regardless of the value of this option.

#### Inherited from

[`Options`](Options.md).[`enableActivityLogging`](Options.md#enableactivitylogging)

***

### externalSessionId?

```ts
optional externalSessionId?: string;
```

An external session identifier provided by the embedder. Included in all analytics
events so embedders can join Glean logs with their own session telemetry.

#### Inherited from

[`Options`](Options.md).[`externalSessionId`](Options.md#externalsessionid)

***

### externalUserId?

```ts
optional externalUserId?: string;
```

An external user identifier provided by the embedder. Included in all analytics
events so embedders can join Glean logs with their own user telemetry.

#### Inherited from

[`Options`](Options.md).[`externalUserId`](Options.md#externaluserid)

***

### fontFaces?

```ts
optional fontFaces?: FontFaceDetails[];
```

A list of custom font-faces to include in the embedded page. When provided, the custom font-faces
can be selected via the fontFamily option.

#### Inherited from

[`Options`](Options.md).[`fontFaces`](Options.md#fontfaces)

***

### fontFamily?

```ts
optional fontFamily?: string;
```

The font-family used for text in the embedded widget.

#### Inherited from

[`Options`](Options.md).[`fontFamily`](Options.md#fontfamily)

***

### fontSize?

```ts
optional fontSize?: "medium" | "large" | "larger";
```

The base font size of the embedded app.

Defaults to 'medium' which corresponds to the browser's default font size, typically 16px.
The actual font sizes of elements are relative to this value, some will be larger or smaller.

#### Inherited from

[`Options`](Options.md).[`fontSize`](Options.md#fontsize)

***

### height?

```ts
optional height?: number;
```

Determines the total height of the widget in the open state. If not
provided 650px is taken as default.

***

### hideAutocomplete?

```ts
optional hideAutocomplete?: boolean;
```

If true, search boxes will not render the autocomplete dropdown.

#### Inherited from

[`SearchOptions`](SearchOptions.md).[`hideAutocomplete`](SearchOptions.md#hideautocomplete)

***

### hideDatasourceFilter?

```ts
optional hideDatasourceFilter?: boolean;
```

If true, hide the datasource filter in the righthand column of the
search results page.

#### Inherited from

[`TabbedSearchOptions`](TabbedSearchOptions.md).[`hideDatasourceFilter`](TabbedSearchOptions.md#hidedatasourcefilter)

***

### key?

```ts
optional key?: string;
```

Uniquely identify the widget.
Must be used if more than one Glean widget of the same type are rendered on the page

Allowed characters: [a-z A-Z - _ . ; :]

#### Inherited from

[`Options`](Options.md).[`key`](Options.md#key)

***

### locale?

```ts
optional locale?: string;
```

Overrides the default locale for the embedded widget users.
If 'auto' (default) is used, Glean will automatically detect the locale from user's browser.
If an unsupported locale is provided, Glean will fallback to use the closest supported locale.

If user picked their locale for Glean, their choice will be respected.

#### Inherited from

[`Options`](Options.md).[`locale`](Options.md#locale)

***

### onAuthTokenRequired?

```ts
optional onAuthTokenRequired?: 
  | (() => Promise<AuthTokenDetails>)
  | (() => void);
```

A callback invoked when the user requires a new authentication token.
Only invoked if an [Options.authToken](Options.md#authtoken) is provided initially and is
nearing expiration.

This option is required when [Options.authMethod](Options.md#authmethod) is 'token'.

**Signatures:**

1. `() => Promise<AuthTokenDetails>` - (Recommended) Return a Promise that
   resolves to the new token details. The SDK will update the token internally
   without requiring a re-render.

#### Example

```ts
onAuthTokenRequired: async () => {
     const token = await fetchNewToken()
     return { token: token.value, expirationTime: token.expiresAt }
   }

2. `() => void` - (Legacy) The callback must fetch a new token and call the
   SDK's render method with updated options containing the new token.
```

#### Inherited from

[`Options`](Options.md).[`onAuthTokenRequired`](Options.md#onauthtokenrequired)

***

### onDatasourceChange?

```ts
optional onDatasourceChange?: (datasource?) => void;
```

A callback invoked when the user changes search tabs to a different
datasource. If `undefined`, all datasources are shown.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `datasource?` | `string` |

#### Returns

`void`

#### Inherited from

[`TabbedSearchOptions`](TabbedSearchOptions.md).[`onDatasourceChange`](TabbedSearchOptions.md#ondatasourcechange)

***

### onSearch

```ts
onSearch: (query) => void;
```

A callback invoked when the user performs a search query.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `query` | `string` |

#### Returns

`void`

#### Inherited from

[`SearchOptions`](SearchOptions.md).[`onSearch`](SearchOptions.md#onsearch)

***

### sourceDocument?

```ts
optional sourceDocument?: DocumentContext;
```

Information about the current document for which Glean widget will show recommendations. If not provided,
the embedder page info is used.

***

### theme?

```ts
optional theme?: Partial<Record<ThemeVariant, Theme>>;
```

A theme applied throughout the embedded widget. If a theme variant (e.g. dark) isn't
supplied, the default Glean theme will be used when the user has applied that variant.
If any color is not supplied for a variant, the default Glean color will be used.

#### Inherited from

[`Options`](Options.md).[`theme`](Options.md#theme)

***

### themeVariant?

```ts
optional themeVariant?: ThemeVariantOrAuto;
```

Overrides the theme variant for the embedded widget (default: light)
If 'auto' is selected, Glean will automatically switch between light and dark
mode and remain in sync with the user device.

#### Inherited from

[`Options`](Options.md).[`themeVariant`](Options.md#themevariant)

***

### unauthorizedMessage?

```ts
optional unauthorizedMessage?: string;
```

A message to display when the current session does not have valid authorization.

The message only applies when [Options.authToken](Options.md#authtoken) is used ([Options.authMethod](Options.md#authmethod) is 'token').
It can be used to instruct the user on how to get back to an authorized session, e,g, "Please refresh the page"
or "Sign in to [SSO provider]".

#### Inherited from

[`Options`](Options.md).[`unauthorizedMessage`](Options.md#unauthorizedmessage)

***

### urlsToOpenInCurrentTab?

```ts
optional urlsToOpenInCurrentTab?: string[];
```

Always open matching URLs in the current tab

Should be an array of strings representing a regular expression.
For example: "^https:\/\/example\\.com.*$" will match any URL that starts with 'https://example.com'.

Rules:
- Every regular expression MUST start with '^' to ensure it matches from the start of the URL.
- Regular expressions do not include search params when matching the URL.
- A maximum of 10 entries are allowed in the array.

#### Inherited from

[`Options`](Options.md).[`urlsToOpenInCurrentTab`](Options.md#urlstoopenincurrenttab)

***

### webAppUrl?

```ts
optional webAppUrl?: string;
```

The web page URL where users access Glean. For example: https://\<subdomain\>.glean.com.

Admins can find this value at https://app.glean.com/admin/about-glean in the `Web app URL` field.

#### Inherited from

[`Options`](Options.md).[`webAppUrl`](Options.md#webappurl)
