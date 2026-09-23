# Glean Developer Docs Indexing

A custom connector, built on
[`glean-indexing-sdk`](https://developers.glean.com/libraries/indexing-sdk), that
indexes this site into the `devdocs` datasource in Glean.

## How it works

The connector reads the site's own build output rather than crawling the live
site, so run `pnpm build` at the repo root first. It indexes two object types:

| Object type    | Source                                                                                         |
| -------------- | ---------------------------------------------------------------------------------------------- |
| `infoPage`     | Every non-API page in `build/mcp/docs.json`, as markdown                                       |
| `apiReference` | Each `/api/**` endpoint page, combined with its `docs/api/**` request, params, and status JSON |

Created and updated times come from `build/indexing/timestamps.json`. Document
IDs are UUIDv5 of the page URL, so they are stable across runs.

| File                          | Role                                                                     |
| ----------------------------- | ------------------------------------------------------------------------ |
| `developer_docs_connector.py` | `DeveloperDocsConnector`: datasource config and `transform()`            |
| `data_client.py`              | `DeveloperDocsDataClient`: reads the build output                        |
| `data_types.py`               | Source-data types                                                        |
| `glean_deployment.yaml`       | Tells the `glean-idx` CLI which connector to load                        |
| `tests/`                      | Unit tests over a fake repo, plus connector tests against a mocked Glean |

Every run is a full crawl, which replaces the datasource contents. As a
safeguard, the connector refuses to upload if the build yields fewer than
`DeveloperDocsConnector.MIN_DOCUMENTS` pages.

## Setup

Tool versions come from the repo's `mise.toml`.

```bash
mise install
cd scripts/indexing
uv sync
```

## Usage

Run from `scripts/indexing` with the `glean-idx` CLI that ships with the SDK.

```bash
# Unit tests (fixtures only, no build needed)
uv run pytest -q

# Run the connector end to end against the build, with Glean mocked
uv run glean-idx test --phase mock

# Index into Glean
export GLEAN_INDEXING_API_TOKEN="your-api-token"
export GLEAN_SERVER_URL="https://your-company-be.glean.com"
uv run glean-idx datasource configure --yes
uv run glean-idx run --yes
```

The same commands are available as `mise run indexing:test`,
`indexing:dry-run`, and `indexing:run` from the repo root.

### Environment variables

- `GLEAN_INDEXING_API_TOKEN`: indexing API token.
- `GLEAN_SERVER_URL`: your Glean backend URL (find it at
  app.glean.com/admin/about-glean). The deprecated `GLEAN_INSTANCE` is still
  accepted.
- `DEVDOCS_REPO_ROOT` (optional): read the build from another checkout.

Copy `.env.example` to `.env` to set these locally.

## GitHub Actions

`.github/workflows/index-developer-docs.yml` builds the site and indexes it
daily at 02:00 UTC, and can be run manually. Each run tests the connector
against the fresh build with Glean mocked before uploading anything.

Manual inputs:

- `dry_run`: stop after the mocked test.
- `force_reindex`: ask Glean to reprocess all documents after upload.
- `disable_stale_deletion_check`: bypass the server-side stale-deletion
  safeguard, for one-off cleanup runs only.
