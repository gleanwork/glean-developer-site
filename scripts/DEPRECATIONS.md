# Overview

The deprecation system displays warnings on API documentation pages when fields, parameters, or enum values are deprecated. Deprecations are extracted from `x-glean-deprecated` extensions in OpenAPI specs and stored in `src/data/deprecations.json`.

## How It Works

1. **OpenAPI specs** contain `x-glean-deprecated` extensions on deprecated fields
2. **`generate-deprecations.ts`** extracts these deprecations and outputs `deprecations.json`
3. **`customMdGenerators.ts`** injects the `<ApiDeprecations>` component into generated API docs
4. **`ApiDeprecations`** component renders the deprecation warnings

## Adding Local Test Deprecations

For local development and testing, you can add test deprecations that won't affect production.

### Step 1: Edit `testExtraEndpoints` in `generate-deprecations.ts`

Open `scripts/generate-deprecations.ts` and add your test deprecations to the `testExtraEndpoints` array:

```typescript
const testExtraEndpoints: EndpointGroup[] = [
  // Add your test deprecation here
  {
    method: 'POST',
    path: '/api/v1/your-endpoint',
    deprecations: [
      {
        id: 'your-unique-deprecation-id',
        type: 'field',  // 'field', 'parameter', 'enum-value', or 'endpoint'
        name: 'fieldName',
        message: 'The fieldName field is deprecated. Use newFieldName instead.',
        introduced: '2025-01-15',  // When the deprecation was introduced
        removal: '2026-01-15',     // When the field will be removed
        docs: 'https://developers.glean.com/docs/migrations/your-migration',  // Optional
      },
    ],
  },
];
```

### Step 2: Regenerate Deprecations

```bash
pnpm run generate:deprecations
```

This updates `src/data/deprecations.json` with your test deprecations.

### Step 3: Regenerate API Docs

The OpenAPI docs plugin doesn't overwrite existing files, so you need to clean and regenerate:

```bash
# For client API
pnpm run openapi:regenerate:client

# For indexing API
pnpm run openapi:regenerate:indexing

# For all APIs
pnpm run openapi:regenerate:all
```

### Step 4: Verify

1. Start the dev server:
   ```bash
   pnpm run dev
   ```

2. Navigate to your API endpoint page:
   ```
   http://localhost:8888/docs/client_api/your-endpoint
   ```

3. You should see a collapsible deprecation notice on the page.

## Deprecation Item Schema

Each deprecation item has the following structure:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier for the deprecation |
| `type` | string | Yes | One of: `field`, `parameter`, `enum-value`, `endpoint` |
| `name` | string | Yes | Name of the deprecated field/parameter |
| `message` | string | Yes | Human-readable deprecation message |
| `introduced` | string | Yes | Date when deprecation was introduced (YYYY-MM-DD) |
| `removal` | string | Yes | Date when the field will be removed (YYYY-MM-DD) |
| `docs` | string | No | URL to migration documentation |
| `enumValue` | string | No | Required if `type` is `enum-value` |

## Path Matching

The deprecation system matches API paths by:

1. Stripping the `/rest` prefix from OpenAPI paths
2. Converting to lowercase
3. Matching against the paths in `deprecations.json`

For example:
- OpenAPI path: `/rest/api/v1/chat`
- Matched path in deprecations.json: `/api/v1/chat`

## x-glean-deprecated in OpenAPI Specs

When adding real deprecations to the OpenAPI spec, use the `x-glean-deprecated` extension:

### Field Deprecation

```yaml
components:
  schemas:
    ChatRequest:
      properties:
        saveChat:
          type: boolean
          x-glean-deprecated:
            id: chat-save-chat-dep
            message: "The saveChat field is deprecated. Use chatPersistence instead."
            introduced: "2025-03-01"
            removal: "2026-01-15"
            docs: "https://developers.glean.com/docs/migrations/chat-persistence"
```

### Enum Value Deprecation

For deprecating specific enum values:

```yaml
components:
  schemas:
    FeedCategory:
      type: string
      enum: [ALL, MIXED, RECENT]
      x-glean-deprecated:
        - kind: enum-value
          enum-value: ALL
          id: feed-category-all-dep
          message: "The ALL category is deprecated. Use MIXED instead."
          introduced: "2025-03-20"
          removal: "2026-01-15"
```

### Property with Enum Value Deprecation

```yaml
components:
  schemas:
    SearchRequest:
      properties:
        clusterType:
          type: string
          enum: [NONE, DOMAIN, DATASOURCE]
          x-glean-deprecated:
            - kind: property
              id: search-cluster-type-dep
              message: "The clusterType field is deprecated."
              introduced: "2025-02-01"
              removal: "2026-10-15"
            - kind: enum-value
              enum-value: NONE
              id: search-cluster-type-none-dep
              message: "The NONE cluster type is deprecated. Omit the field instead."
              introduced: "2025-02-01"
              removal: "2026-10-15"
```

## Testing the Deprecations Page

The deprecations page at `/deprecations` shows all active deprecations. To view it:

1. Navigate to `http://localhost:8888/deprecations`
2. The page lists all deprecations grouped by endpoint

## Troubleshooting

### Deprecations not showing up

1. **Files not regenerated**: Run `pnpm run openapi:regenerate:client`
2. **Deprecation expired**: Check the `removal` date - past dates are filtered out
3. **Path mismatch**: Ensure the path in `deprecations.json` matches (without `/rest` prefix)

### Verify deprecations.json was updated

```bash
cat src/data/deprecations.json | jq '.endpoints[] | .path'
```

### Check if ApiDeprecations is in generated MDX

```bash
grep -l "ApiDeprecations" docs/api/client-api/**/*.api.mdx
```

### Run the deprecation generator tests

```bash
pnpm test scripts/deprecations-lib.test.ts
```

## Files Reference

| File | Description |
|------|-------------|
| `scripts/generate-deprecations.ts` | Main script to generate deprecations.json |
| `scripts/deprecations-lib.ts` | Library for parsing x-glean-deprecated from OpenAPI |
| `scripts/generator/customMdGenerators.ts` | Injects ApiDeprecations into generated docs |
| `src/data/deprecations.json` | Generated deprecations data |
| `src/theme/ApiDeprecations/index.tsx` | React component for API page deprecation UI |
| `src/components/Deprecations/DeprecationsEntries.tsx` | Component for /deprecations page |
| `docs/deprecations/index.mdx` | The deprecations listing page |
