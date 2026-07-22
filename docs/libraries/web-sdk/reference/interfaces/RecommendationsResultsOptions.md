# RecommendationsResultsOptions

## Extends

- `Pick`\<[`TabbedSearchOptions`](TabbedSearchOptions.md), `"hideDatasourceFilter"` \| `"onDatasourceChange"`\>

## Extended by

- [`RecommendationsOptions`](RecommendationsOptions.md)

## Properties

### hideDatasourceFilter?

```ts
optional hideDatasourceFilter?: boolean;
```

If true, hide the datasource filter in the righthand column of the
search results page.

#### Inherited from

[`TabbedSearchOptions`](TabbedSearchOptions.md).[`hideDatasourceFilter`](TabbedSearchOptions.md#hidedatasourcefilter)

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
