"""Tests for DeveloperDocsDataClient.

Strategy: build a minimal fake repo on disk via the `fake_repo` fixture (see
conftest.py), point the client at it, and exercise the real file-loading +
parsing paths. No mocking of the filesystem.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from data_client import ApiRoute, DeveloperDocsDataClient


@pytest.fixture
def client(fake_repo: Path) -> DeveloperDocsDataClient:
    return DeveloperDocsDataClient(repo_root=str(fake_repo))


class TestSimplifySchema:
    """_simplify_schema flattens deeply-nested JSON Schema into a small dict."""

    def test_keeps_basic_keys(self) -> None:
        c = DeveloperDocsDataClient()
        out = c._simplify_schema(
            {"type": "string", "description": "foo", "enum": ["A", "B"]}
        )
        assert out == {"type": "string", "description": "foo", "enum": ["A", "B"]}

    def test_drops_unknown_keys(self) -> None:
        c = DeveloperDocsDataClient()
        out = c._simplify_schema(
            {"type": "string", "x-internal": "secret", "$id": "#/foo"}
        )
        assert "x-internal" not in out
        assert "$id" not in out

    def test_recurses_into_properties(self) -> None:
        c = DeveloperDocsDataClient()
        out = c._simplify_schema(
            {
                "type": "object",
                "properties": {
                    "name": {"type": "string", "description": "n"},
                    "age": {"type": "integer", "description": "a"},
                },
            }
        )
        assert out["properties"]["name"] == {"type": "string", "description": "n"}
        assert out["properties"]["age"] == {"type": "integer", "description": "a"}

    def test_recurses_into_items(self) -> None:
        c = DeveloperDocsDataClient()
        out = c._simplify_schema(
            {"type": "array", "items": {"type": "string", "description": "s"}}
        )
        assert out["items"] == {"type": "string", "description": "s"}

    def test_truncates_at_max_depth(self) -> None:
        # max_depth=2: nodes at depth 2 should be collapsed to a stub.
        c = DeveloperDocsDataClient()
        out = c._simplify_schema(
            {
                "type": "object",
                "properties": {
                    "outer": {
                        "type": "object",
                        "properties": {
                            "inner": {
                                "type": "object",
                                "description": "deeply nested",
                                "properties": {
                                    "leaf": {"type": "string"},
                                },
                            }
                        },
                    }
                },
            },
            max_depth=2,
        )
        # outer is at depth 1, inner is at depth 2 — should be a stub
        inner = out["properties"]["outer"]["properties"]["inner"]
        assert inner == {"type": "object", "description": "deeply nested"}

    def test_merges_allof(self) -> None:
        c = DeveloperDocsDataClient()
        out = c._simplify_schema(
            {
                "description": "wrapper",
                "allOf": [
                    {
                        "type": "object",
                        "required": ["name"],
                        "properties": {"name": {"type": "string"}},
                    }
                ],
            }
        )
        # allOf merging should surface the inner type/required/properties.
        assert out["type"] == "object"
        assert out["required"] == ["name"]
        assert "name" in out["properties"]


class TestLoadRequestSchema:
    """_load_request_schema reads <slug>.RequestSchema.json from schema_dir."""

    def test_loads_client_api_schema(self, client: DeveloperDocsDataClient) -> None:
        route = ApiRoute(api="client-api", group="activity", slug="feedback")
        body = client._load_request_schema(route)
        # Should produce a JSON string with the simplified shape.
        parsed = json.loads(body)
        assert parsed["type"] == "object"
        assert parsed["required"] == ["event"]
        assert "event" in parsed["properties"]

    def test_loads_indexing_api_flat_schema(self, client: DeveloperDocsDataClient) -> None:
        route = ApiRoute(api="indexing-api", group=None, slug="add-or-update-datasource")
        body = client._load_request_schema(route)
        # The fixture uses allOf — make sure it merged into something useful.
        parsed = json.loads(body)
        assert parsed["type"] == "object"
        assert "name" in parsed["properties"]

    def test_returns_empty_when_file_missing(self, client: DeveloperDocsDataClient) -> None:
        route = ApiRoute(api="client-api", group="activity", slug="nonexistent")
        assert client._load_request_schema(route) == ""

    def test_returns_empty_when_file_malformed(
        self, client: DeveloperDocsDataClient, fake_repo: Path
    ) -> None:
        bad = fake_repo / "docs" / "api" / "client-api" / "activity" / "broken.RequestSchema.json"
        bad.write_text("{ this is not valid json")
        route = ApiRoute(api="client-api", group="activity", slug="broken")
        assert client._load_request_schema(route) == ""

    def test_truncates_oversized_schema(
        self, client: DeveloperDocsDataClient, fake_repo: Path
    ) -> None:
        huge = {
            "body": {
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "object",
                            "properties": {
                                f"prop_{i}": {
                                    "type": "string",
                                    "description": "x" * 200,
                                }
                                for i in range(500)
                            },
                        }
                    }
                }
            }
        }
        path = fake_repo / "docs" / "api" / "client-api" / "activity" / "huge.RequestSchema.json"
        path.write_text(json.dumps(huge))
        route = ApiRoute(api="client-api", group="activity", slug="huge")
        body = client._load_request_schema(route)
        assert len(body) <= client.MAX_SCHEMA_CHARS + len("\n... (truncated)")
        assert body.endswith("... (truncated)")


class TestLoadStatusCodes:
    def test_loads_codes_with_descriptions(self, client: DeveloperDocsDataClient) -> None:
        route = ApiRoute(api="client-api", group="activity", slug="feedback")
        codes, body = client._load_status_codes(route)
        assert codes == [
            "200: OK",
            "400: Bad Request",
            "401: Not Authorized",
        ]
        # Success body schema should be populated since the fixture has 200 with a schema.
        assert body
        assert "id" in body

    def test_returns_empty_when_file_missing(self, client: DeveloperDocsDataClient) -> None:
        route = ApiRoute(api="client-api", group="activity", slug="missing")
        assert client._load_status_codes(route) == ([], "")

    def test_handles_201_as_success(
        self, client: DeveloperDocsDataClient, fake_repo: Path
    ) -> None:
        # Some endpoints return 201 instead of 200 — confirm that fallback works.
        path = fake_repo / "docs" / "api" / "client-api" / "activity" / "created.StatusCodes.json"
        path.write_text(
            json.dumps(
                {
                    "responses": {
                        "201": {
                            "description": "Created",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {
                                            "id": {"type": "string"},
                                        },
                                    }
                                }
                            },
                        }
                    }
                }
            )
        )
        route = ApiRoute(api="client-api", group="activity", slug="created")
        codes, body = client._load_status_codes(route)
        assert codes == ["201: Created"]
        assert "id" in body


class TestLoadParams:
    def test_separates_query_and_path_params(self, client: DeveloperDocsDataClient) -> None:
        route = ApiRoute(api="client-api", group="activity", slug="feedback")
        query, path = client._load_params(route)
        # Both are JSON strings.
        q = json.loads(query)
        p = json.loads(path)
        assert "feedback" in q
        assert q["feedback"]["in"] == "query"
        assert "datasourceId" in p
        assert p["datasourceId"]["in"] == "path"

    def test_returns_empty_when_file_missing(self, client: DeveloperDocsDataClient) -> None:
        route = ApiRoute(api="indexing-api", group=None, slug="add-or-update-datasource")
        assert client._load_params(route) == ("", "")


class TestExtractMethodAndEndpoint:
    """_extract_method_and_endpoint pulls METHOD + path from API ref markdown."""

    def test_finds_post(self) -> None:
        c = DeveloperDocsDataClient()
        method, endpoint = c._extract_method_and_endpoint(
            "# Title\n\nPOST\n/rest/api/v1/feedback\n\nbody"
        )
        assert method == "POST"
        assert endpoint == "/rest/api/v1/feedback"

    @pytest.mark.parametrize("verb", ["GET", "POST", "PUT", "DELETE", "PATCH"])
    def test_recognizes_each_verb(self, verb: str) -> None:
        c = DeveloperDocsDataClient()
        method, endpoint = c._extract_method_and_endpoint(f"{verb}\n/v1/x")
        assert method == verb
        assert endpoint == "/v1/x"

    def test_returns_empty_on_no_match(self) -> None:
        c = DeveloperDocsDataClient()
        method, endpoint = c._extract_method_and_endpoint("# Title\n\nNo HTTP verb here.")
        assert method == ""
        assert endpoint == ""

    def test_picks_first_verb(self) -> None:
        c = DeveloperDocsDataClient()
        method, endpoint = c._extract_method_and_endpoint("GET\n/first\n\nPOST\n/second")
        assert method == "GET"
        assert endpoint == "/first"


class TestLoadTimestamps:
    def test_loads_existing_file(self, client: DeveloperDocsDataClient) -> None:
        ts = client._load_timestamps()
        assert "https://developers.glean.com/guides/getting-started" in ts
        assert (
            ts["https://developers.glean.com/guides/getting-started"]["createdAt"]
            == 1700000000
        )

    def test_caches_after_first_load(self, client: DeveloperDocsDataClient, fake_repo: Path) -> None:
        first = client._load_timestamps()
        # Mutate the on-disk file; cache should win on the second call.
        (fake_repo / "build" / "indexing" / "timestamps.json").write_text("{}")
        second = client._load_timestamps()
        assert first is second  # same object identity = cache hit

    def test_empty_when_file_missing(self, empty_repo: Path) -> None:
        c = DeveloperDocsDataClient(repo_root=str(empty_repo))
        assert c._load_timestamps() == {}

    def test_empty_when_file_malformed(self, fake_repo: Path) -> None:
        # Overwrite with junk.
        (fake_repo / "build" / "indexing" / "timestamps.json").write_text("not json")
        c = DeveloperDocsDataClient(repo_root=str(fake_repo))
        assert c._load_timestamps() == {}


class TestIsApiReference:
    """_is_api_reference uses ApiRoute.parse + is_overview."""

    @pytest.mark.parametrize(
        "route,expected",
        [
            ("/api/client-api/activity/feedback", True),
            ("/api/indexing-api/add-or-update-datasource", True),
            ("/api/client-api/search/overview", False),    # overview => info
            ("/api/indexing-api/authentication-overview", False),
            ("/guides/mcp", False),                         # not an api route
            ("/", False),
            ("", False),
            ("/api/client-api", False),                     # missing slug
        ],
    )
    def test_classification(
        self, client: DeveloperDocsDataClient, route: str, expected: bool
    ) -> None:
        assert client._is_api_reference(route) is expected


class TestBuildInfoPage:
    def test_includes_timestamps_when_present(self, client: DeveloperDocsDataClient) -> None:
        url = "https://developers.glean.com/guides/getting-started"
        page = client._build_info_page(
            url,
            {"title": "Getting Started", "markdown": "# Hi"},
        )
        assert page["url"] == url
        assert page["page_type"] == "info_page"
        assert page["title"] == "Getting Started"
        assert page["created_at"] == 1700000000
        assert page["updated_at"] == 1735689600

    def test_id_is_deterministic_uuid5(self, client: DeveloperDocsDataClient) -> None:
        import uuid as uuid_lib

        url = "https://developers.glean.com/guides/getting-started"
        page = client._build_info_page(url, {"title": "x", "markdown": ""})
        expected = str(uuid_lib.uuid5(uuid_lib.NAMESPACE_URL, url))
        assert page["id"] == expected

    def test_omits_timestamps_when_url_not_in_map(
        self, client: DeveloperDocsDataClient
    ) -> None:
        url = "https://developers.glean.com/some/other/page"
        page = client._build_info_page(url, {"title": "Other", "markdown": ""})
        assert page["created_at"] is None
        assert page["updated_at"] is None


class TestBuildApiReference:
    def test_client_api_endpoint_has_full_data(self, client: DeveloperDocsDataClient) -> None:
        url = "https://developers.glean.com/api/client-api/activity/feedback"
        page = client._build_api_reference(
            url,
            {
                "title": "Report client activity",
                "description": "Report events.",
                "route": "/api/client-api/activity/feedback",
                "markdown": "# Report client activity\n\nPOST\n/rest/api/v1/feedback",
            },
        )
        assert page["page_type"] == "api_reference"
        assert page["tag"] == "activity"
        assert page["method"] == "POST"
        assert page["endpoint"] == "/rest/api/v1/feedback"
        # Schema files were written by the fixture, so all four should be populated.
        assert page["request_body"]
        assert page["response_codes"]
        assert page["request_query_parameters"]
        assert page["request_path_parameters"]
        # Timestamps from the fixture's timestamps.json
        assert page["created_at"] == 1700000001
        assert page["updated_at"] == 1735689601

    def test_indexing_api_endpoint_has_empty_tag(self, client: DeveloperDocsDataClient) -> None:
        url = "https://developers.glean.com/api/indexing-api/add-or-update-datasource"
        page = client._build_api_reference(
            url,
            {
                "title": "Add or update datasource",
                "description": "Add or update.",
                "route": "/api/indexing-api/add-or-update-datasource",
                "markdown": "# Add or update datasource\n\nPOST\n/api/index/v1/adddatasource",
            },
        )
        assert page["tag"] == ""
        assert page["request_body"]
        assert page["response_codes"]
        # The fixture's timestamps.json doesn't include this URL.
        assert page["created_at"] is None
        assert page["updated_at"] is None

    def test_raises_on_unrecognized_route(self, client: DeveloperDocsDataClient) -> None:
        with pytest.raises(ValueError, match="non-API route"):
            client._build_api_reference(
                "https://developers.glean.com/guides/mcp",
                {"title": "x", "route": "/guides/mcp", "markdown": ""},
            )


class TestGetSourceData:
    """Integration: walks docs.json end-to-end and dispatches to the right builder."""

    def test_returns_all_pages_with_correct_types(
        self, client: DeveloperDocsDataClient
    ) -> None:
        pages = client.get_source_data()
        # Fixture has 4 entries: 1 info + 1 nested API + 1 flat API + 1 overview (info)
        assert len(pages) == 4
        info_pages = [p for p in pages if p["page_type"] == "info_page"]
        api_pages = [p for p in pages if p["page_type"] == "api_reference"]
        assert len(info_pages) == 2  # getting-started + search/overview
        assert len(api_pages) == 2

    def test_overview_routed_as_info_page(self, client: DeveloperDocsDataClient) -> None:
        pages = client.get_source_data()
        overview = next(
            p for p in pages if p["url"].endswith("/api/client-api/search/overview")
        )
        assert overview["page_type"] == "info_page"

    def test_raises_when_docs_json_missing(self, empty_repo: Path) -> None:
        c = DeveloperDocsDataClient(repo_root=str(empty_repo))
        with pytest.raises(RuntimeError, match="docs.json not found"):
            c.get_source_data()

    def test_pages_carry_timestamps_when_known(self, client: DeveloperDocsDataClient) -> None:
        pages = client.get_source_data()
        feedback = next(
            p for p in pages if p["url"].endswith("/api/client-api/activity/feedback")
        )
        assert feedback["created_at"] == 1700000001
        assert feedback["updated_at"] == 1735689601

    def test_pages_lacking_timestamps_get_none(self, client: DeveloperDocsDataClient) -> None:
        pages = client.get_source_data()
        # The fixture's add-or-update-datasource entry has no timestamp row.
        au = next(
            p for p in pages
            if p["url"].endswith("/api/indexing-api/add-or-update-datasource")
        )
        assert au["created_at"] is None
        assert au["updated_at"] is None
