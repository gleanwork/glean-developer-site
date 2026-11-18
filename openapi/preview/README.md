# Preview API reference pages

Unlisted API reference pages for operations that `gleanwork/open-api` holds
out of its final specs (`config/unreleased-operations.yaml`), so they can be
shared by direct link with specific customers before general availability.

| Operation                   | Spec                       | Page                                        |
| --------------------------- | -------------------------- | ------------------------------------------- |
| `POST /api/search/enumeration` | `search-enumeration.yaml` | `/api/preview/platform-search-enumeration` |

Pages are hidden, not secret: they ship in every build and anyone with the
URL can read them.

## Refresh

Manual only. No workflow or other script runs this.

```bash
pnpm preview-api:refresh
```

This fetches the unfiltered source spec
(`https://gleanwork.github.io/open-api/specs/source/platform.yaml`), extracts
`POST /search/enumeration` and every component it references into
`search-enumeration.yaml` (`scripts/openapi-preview-extract.mjs`), rewrites
its servers like the main specs (`scripts/openapi-server-url.mjs`), and
regenerates `docs/api/preview/` (`pnpm preview-api:generate`). Commit both
directories.

## How the page stays hidden

- `unlisted: true` frontmatter (from `scripts/generator/preview-api-page.mustache`):
  Docusaurus leaves it out of sidebars, pagination, and the sitemap, and adds
  `<meta name="robots" content="noindex, nofollow">`.
- No sidebar entry. `pnpm sidebar:check` only scans the client, indexing, and
  platform API directories.
- `docusaurus.config.ts` excludes `/api/preview/**` from the sitemap,
  `llms.txt`, and the MCP plugin. Site search indexes the MCP plugin's
  `build/mcp/docs.json`, so this also keeps the page out of search.
- `vercel.json` sends `X-Robots-Tag: noindex, nofollow` for `/api/preview/*`.

## Keep it away from SDK generation

- Do not move these entries into `openApiPluginOptions.config` in
  `openapi.config.ts`. Scripts iterate that object, and the automated
  `openapi:regenerate:all` (`.github/workflows/trigger-redeploy.yml`) must
  never read these specs.
- Do not add `preview-api:*` to any other script or workflow, and do not
  upload or sync anything in this directory.

## Remove when the operation ships publicly

Once the operation is in `specs/final/platform.yaml`, the regular Platform
API pipeline generates its page at
`/api/platform-api/platform-search-enumeration`. Then:

1. Delete `openapi/preview/search-enumeration.yaml` and
   `docs/api/preview/`.
2. Delete the `preview-search-enumeration` entry from `previewOpenApiConfig`
   in `openapi.config.ts`. If it was the last entry, also delete
   `previewOpenApiConfig`, `PREVIEW_NOTICE`, the `previewApiRoutes` exclusions
   in `docusaurus.config.ts`, the `/api/preview/` header rules in
   `vercel.json` (restore `X-Robots-Tag: all` to the `/(.*)` rule),
   `scripts/openapi-preview-extract.mjs`,
   `scripts/generator/preview-api-page.mustache`, the `preview-api:*` scripts
   in `package.json`, and this directory.
3. Add a permanent redirect in `vercel.json` from
   `/api/preview/platform-search-enumeration` to
   `/api/platform-api/platform-search-enumeration`, so shared links keep
   working.
