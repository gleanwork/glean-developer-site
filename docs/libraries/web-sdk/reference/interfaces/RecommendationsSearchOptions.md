# RecommendationsSearchOptions

## Extends

- `Pick`\<[`SearchOptions`](SearchOptions.md), `"hideAutocomplete"` \| `"onSearch"` \| `"datasource"` \| `"datasourcesFilter"`\>

## Extended by

- [`RecommendationsOptions`](RecommendationsOptions.md)

## Properties

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

### hideAutocomplete?

```ts
optional hideAutocomplete?: boolean;
```

If true, search boxes will not render the autocomplete dropdown.

#### Inherited from

[`SearchOptions`](SearchOptions.md).[`hideAutocomplete`](SearchOptions.md#hideautocomplete)

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
