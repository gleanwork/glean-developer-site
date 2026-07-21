# Options

## Extended by

- [`ChatOptions`](ChatOptions.md)
- [`RecommendationsOptions`](RecommendationsOptions.md)
- [`SearchOptions`](SearchOptions.md)
- [`SettingsOptions`](SettingsOptions.md)

## Properties

### authMethod?

```ts
optional authMethod?: "sso" | "token";
```

The authentication method to use in the embedded widget.

sso - Logged out users will see a login button in the embedded widget. Clicking
 the button will open the SSO login flow in a new window.

token - The embedding page obtains an auth token on behalf of the user and passes
 it to the embedded widget. If this method is specified the [Options.authToken](#authtoken) and
 [Options.onAuthTokenRequired](#onauthtokenrequired) options must also be specified.

***

### authToken?

```ts
optional authToken?: AuthTokenDetails;
```

An authentication token for the user. Providing this obviates the need for
the user to separately login to Glean. May be obtained via:
https://developers.glean.com/api/client-api/authentication/createauthtoken

If an authToken is provided, [Options.onAuthTokenRequired](#onauthtokenrequired) must also
be provided.

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

***

### disableAnalytics?

```ts
optional disableAnalytics?: boolean;
```

If true, Glean will not collect client analytics or log activity for the embedded session.

Analytics data is used to monitor and improve the product experience, so it's recommended
to leave data collection on unless the user has specifically requested otherwise.

***

### disableAssistant?

```ts
optional disableAssistant?: boolean;
```

If true, Glean Assistant will not be enabled for the embedded session, including but not limited to
generated answers, summaries, chat, and other features.

***

### domainsToOpenInCurrentTab?

```ts
optional domainsToOpenInCurrentTab?: string[];
```

Always open links from these domains in the current tab.

Expects a list of one or more domain suffixes, e.g. `['example.com', 'foo.example.org']`.

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

***

### externalSessionId?

```ts
optional externalSessionId?: string;
```

An external session identifier provided by the embedder. Included in all analytics
events so embedders can join Glean logs with their own session telemetry.

***

### externalUserId?

```ts
optional externalUserId?: string;
```

An external user identifier provided by the embedder. Included in all analytics
events so embedders can join Glean logs with their own user telemetry.

***

### fontFaces?

```ts
optional fontFaces?: FontFaceDetails[];
```

A list of custom font-faces to include in the embedded page. When provided, the custom font-faces
can be selected via the fontFamily option.

***

### fontFamily?

```ts
optional fontFamily?: string;
```

The font-family used for text in the embedded widget.

***

### fontSize?

```ts
optional fontSize?: "medium" | "large" | "larger";
```

The base font size of the embedded app.

Defaults to 'medium' which corresponds to the browser's default font size, typically 16px.
The actual font sizes of elements are relative to this value, some will be larger or smaller.

***

### key?

```ts
optional key?: string;
```

Uniquely identify the widget.
Must be used if more than one Glean widget of the same type are rendered on the page

Allowed characters: [a-z A-Z - _ . ; :]

***

### locale?

```ts
optional locale?: string;
```

Overrides the default locale for the embedded widget users.
If 'auto' (default) is used, Glean will automatically detect the locale from user's browser.
If an unsupported locale is provided, Glean will fallback to use the closest supported locale.

If user picked their locale for Glean, their choice will be respected.

***

### onAuthTokenRequired?

```ts
optional onAuthTokenRequired?: 
  | (() => Promise<AuthTokenDetails>)
  | (() => void);
```

A callback invoked when the user requires a new authentication token.
Only invoked if an [Options.authToken](#authtoken) is provided initially and is
nearing expiration.

This option is required when [Options.authMethod](#authmethod) is 'token'.

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

***

### theme?

```ts
optional theme?: Partial<Record<ThemeVariant, Theme>>;
```

A theme applied throughout the embedded widget. If a theme variant (e.g. dark) isn't
supplied, the default Glean theme will be used when the user has applied that variant.
If any color is not supplied for a variant, the default Glean color will be used.

***

### themeVariant?

```ts
optional themeVariant?: ThemeVariantOrAuto;
```

Overrides the theme variant for the embedded widget (default: light)
If 'auto' is selected, Glean will automatically switch between light and dark
mode and remain in sync with the user device.

***

### unauthorizedMessage?

```ts
optional unauthorizedMessage?: string;
```

A message to display when the current session does not have valid authorization.

The message only applies when [Options.authToken](#authtoken) is used ([Options.authMethod](#authmethod) is 'token').
It can be used to instruct the user on how to get back to an authorized session, e,g, "Please refresh the page"
or "Sign in to [SSO provider]".

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

***

### webAppUrl?

```ts
optional webAppUrl?: string;
```

The web page URL where users access Glean. For example: https://\<subdomain\>.glean.com.

Admins can find this value at https://app.glean.com/admin/about-glean in the `Web app URL` field.
