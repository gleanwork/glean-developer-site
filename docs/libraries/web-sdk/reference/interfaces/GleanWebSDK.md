# GleanWebSDK

Entry point for all Glean embedded widgets.

The SDK will dispatch a `glean:ready` event when the GleanWebSDK is ready to use,
see below for examples of how to use the event.

Note that you only need this if you are integrating Glean via a deferred script tag.

## Example

```ts
// example via plain JS
let isGleanReady = !!window.GleanWebSDK
window.addEventListener("glean:ready", () => {
 isGleanReady = true
})

if (isGleanReady) {
  // ready to use window.GleanWebSDK.<method>
}

// example via react hook
const subscribe = (callback: () => void) => {
  window.addEventListener("glean:ready", callback)
  return window.removeEventListener("glean:ready", callback)
}
const useIsGleanReady = useSyncExternalStore(subscribe, () => !!window.GleanWebSDK)

const YourComponent = () => {
  const isGleanReady = useIsGleanReady()

  useEffect(() => {
    if (isGleanReady) {
      // ready to use window.GleanWebSDK.<method>
    }
  }, [isGleanReady])
}
```

## Properties

### attach

```ts
attach: (element, options?) => WidgetHandle;
```

Attaches a complete, modal Glean Search to the given input element.

#### User interface
When the given input element is clicked, a modal dialog is immediately
presented over the center of the page. It displays a more prominent
search box and initial suggested documents and queries. As text is entered,
autocomplete is performed, refining the suggestions. Upon pressing enter,
the full search results are displayed in the modal. The modal is dismissed
by clicking outside of its boundaries or on the close button. External links
are opened in a new tab (`target=_blank`). If a non-empty query is passed in options the search modal will automatically
open and display results for the query.

#### Usage
1. Render a dummy search input box to the page with the desired styling.
2. Pass a reference to it to this method along with appropriate options. This
   method will handle all user interaction.
3. Handle the [SearchOptions.onSearch](SearchOptions.md#onsearch) callback if desired
   (e.g. for tracking purposes).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `element` | `HTMLElement` | A focusable element such as a text `input` or `contenteditable`. |
| `options?` | [`ModalSearchOptions`](ModalSearchOptions.md) | Configuration options for the search modal. |

#### Returns

[`WidgetHandle`](WidgetHandle.md)

An imperative handle ([WidgetHandle](WidgetHandle.md)) for Glean modal search.

***

### ~~attachAutocomplete~~

```ts
attachAutocomplete: (element, options) => WidgetHandle;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `element` | `HTMLElement` |
| `options` | [`SearchBoxOptions`](SearchBoxOptions.md) |

#### Returns

[`WidgetHandle`](WidgetHandle.md)

#### Deprecated

Renamed `renderSearchBox`.

***

### createGuestAuthProvider

```ts
createGuestAuthProvider: (options) => GuestAuthProvider;
```

Creates an auth provider to generate auth tokens for guest users.
This is only supported if you are using Glean External Search.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`GuestAuthProviderOptions`](GuestAuthProviderOptions.md) |

#### Returns

[`GuestAuthProvider`](GuestAuthProvider.md)

***

### getChatOptionsFromUrl

```ts
getChatOptionsFromUrl: (deleteParams) => ChatUrlParams;
```

Attempts to read some configuration options for the embedded chat widget from
the current URL of the embedding page. See [ChatOptions](ChatOptions.md) for details.

#### Usage
renderChat(containerRef.current, {
  ...getChatOptionsFromUrl(),
  chatId: searchParams.get("chatId") ?? "",
  onChat: (chatId: string) => setSearchParams({ chatId }),
  onSearch: (query: string) => navigate({ pathname: '/search', search: new URLSearchParams({ query }).toString() }),
});

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `deleteParams` | `boolean` |

#### Returns

`ChatUrlParams`

***

### ~~openSidebar~~

```ts
openSidebar: (options) => Promise<void>;
```

Opens a sidebar with a search box, recommendations and results.

#### User interface
A sidebar with a search box slides in from the right of the page.

If [SearchOptions.query](SearchOptions.md#query) is given then search results
are displayed for the given query by default.

When a search result is clicked, it is opened in a new
tab (`target=_blank`). The sidebar is closed when the close button
within the sidebar is clicked or the escape key is pressed.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options` | [`SearchOptions`](SearchOptions.md) | Configuration options for the search results. |

#### Returns

`Promise`\<`void`\>

#### Deprecated

will be removed in future versions.

***

### renderChat

```ts
renderChat: (element, options) => ChatHandle;
```

Renders Glean AI chat inside the given container element

#### Usage
1. Render a block level element in the page with the desired
   dimensions in the viewport.
2. Pass it to this method along with appropriate options.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `element` | `HTMLElement` | A containing HTML element such as a `div` to render the widget into. The container must be a block-level element with a non static position such as 'relative'. |
| `options` | [`ChatOptions`](ChatOptions.md) | Configuration options for the chat widget |

#### Returns

[`ChatHandle`](ChatHandle.md)

An imperative handle ([ChatHandle](ChatHandle.md)) for Glean chat.

***

### renderRecommendations

```ts
renderRecommendations: (element, options) => void;
```

Renders Glean recommendations inside the given container element

#### User Interface
The widget includes a Glean search box and shows contextual
recommendations based on the current page.

On clicking the search box, autocomplete dropdown opens with suggestions
based on the query being typed in. This may extend beyond the container
bounds based on the suggestions. Upon pressing enter, the search results
are displayed responsively in the container along with datasources tabs
and facet filters. Search results, when clicked are opened in a new tab.

On the search page, a back button is shown beside the search box which
can be used to navigate to the previous page.

#### Usage
1. Render a block level element in the page with the desired
   dimensions in the viewport. Minimum height recommended is 600px.
2. Pass it to this method along with appropriate options.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `element` | `HTMLElement` | A containing HTML element such as a `div` to render the recommendations widget into. The container must be a block-level element with a non static position such as 'relative'. |
| `options` | [`RecommendationsOptions`](RecommendationsOptions.md) | Configuration options for the recommendations widget |

#### Returns

`void`

***

### renderSearchBox

```ts
renderSearchBox: (element, options) => WidgetHandle;
```

Displays Glean Search autocomplete inside the given container element.

#### User interface
A search box is rendered within the bounds of the provided container
element. The box will take up the full space of the container minus
any space required for the margins specified in the customization
options [SearchBoxOptions.searchBoxCustomizations](SearchBoxOptions.md#searchboxcustomizations). For example,
if the search box should be 40px tall with a 5px margin on the top and
bottom, the container should be 50px tall with `verticalMargin: 5`.
If a `boxShadow` is specified, the margin should be large enough to
display it.

#### Usage
1. Render a container element to the page with the desired size.
2. Pass it to this method along with appropriate options.
3. Handle the [SearchBoxOptions.onSearch](SearchOptions.md#onsearch) callback as desired
   (e.g. by calling [GleanWebSDK.renderSearchResults](#rendersearchresults)) and
   updating the page title/url.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `element` | `HTMLElement` | A containing HTML element such as a `div` to render the search box into. The container must have both `position:relative` and `display:block` applied. |
| `options` | [`SearchBoxOptions`](SearchBoxOptions.md) | Configuration options for the search box. |

#### Returns

[`WidgetHandle`](WidgetHandle.md)

An imperative handle ([WidgetHandle](WidgetHandle.md)) for Glean autocomplete.

***

### renderSearchResults

```ts
renderSearchResults: (element, options) => void;
```

Renders Glean Search results into the given element.

#### User interface
The search results, datasource tabs and facet filters are
displayed responsively to fill the entire element. The caller is
responsible for rendering a search input box and handling
callback events.

When a link that results in a new query is clicked (such as a
spell correction), the [TabbedSearchOptions.onSearch](SearchOptions.md#onsearch)
callback is invoked but the query is not automatically changed.
When the user changes datasource tabs, the interface is updated
and the [TabbedSearchOptions.onDatasourceChange](TabbedSearchOptions.md#ondatasourcechange) callback is
invoked. When a search result is clicked, it is opened in a new
tab (`target=_blank`).

#### Usage
1. Render a block level element in the page with the desired
   dimensions in the viewport.
2. Pass it to this method along with appropriate options.
3. Respond to the [TabbedSearchOptions.onSearch](SearchOptions.md#onsearch) callback
   by invoking this render method with the same element and the new
   query. At the same time, it's usually appropriate to update any
   search box text, page title and URL.
4. Optionally, respond to the [TabbedSearchOptions.onDatasourceChange](TabbedSearchOptions.md#ondatasourcechange)
   callback by updating the URL to preserve state.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `element` | `HTMLElement` | A containing HTML element such as a `div` to render the search box into. The container must have both `position:relative` and `display:block` applied. |
| `options` | [`TabbedSearchOptions`](TabbedSearchOptions.md) | Configuration options for the search results. |

#### Returns

`void`

***

### renderSettings

```ts
renderSettings: (element, options) => void;
```

**`Beta`**

Renders Glean settings inside the given container element

#### Usage
1. Render a block level element in the page with the desired
   dimensions in the viewport. It is recommended that the width be at least 800px
   and the height be at least 600px.
2. Pass it to this method along with appropriate options.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `element` | `HTMLElement` | A containing HTML element such as a `div` to render the widget into. The container must be a block-level element with a non static position such as 'relative'. |
| `options` | [`SettingsOptions`](SettingsOptions.md) | Configuration options for the settings widget This API is experimental and may change at any time. |

#### Returns

`void`
