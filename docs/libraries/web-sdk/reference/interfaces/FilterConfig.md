# FilterConfig

## Properties

### iconName

```ts
iconName: string;
```

The name of a glyph icon to display next to the filter name. Supported values are a subset
of those found at https://www.feathericons.com. Contact Glean to add support for new values.

***

### key

```ts
key: string;
```

The unique identifier of the filter. If the filter is based on a property of custom datasource
documents, the key should match the name of the custom property.

***

### placeholder

```ts
placeholder: string;
```

Placeholder text to show when no filter value is selected.
