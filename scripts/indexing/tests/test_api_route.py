"""Unit tests for the ApiRoute dataclass."""

from __future__ import annotations

import pytest

from data_client import ApiRoute


class TestApiRouteParseClientApi:
    """Nested 5-segment routes: /api/client-api/<group>/<slug>"""

    def test_parses_typical_endpoint(self) -> None:
        r = ApiRoute.parse("/api/client-api/activity/feedback")
        assert r is not None
        assert r.api == "client-api"
        assert r.group == "activity"
        assert r.slug == "feedback"

    def test_schema_dir_includes_group(self) -> None:
        r = ApiRoute.parse("/api/client-api/activity/feedback")
        assert r is not None
        assert r.schema_dir == "client-api/activity"

    def test_overview_endpoint_marked_as_overview(self) -> None:
        r = ApiRoute.parse("/api/client-api/search/overview")
        assert r is not None
        assert r.is_overview is True

    def test_non_overview_endpoint_is_not_overview(self) -> None:
        r = ApiRoute.parse("/api/client-api/activity/feedback")
        assert r is not None
        assert r.is_overview is False

    def test_slug_containing_overview_substring_is_treated_as_overview(self) -> None:
        # By design: "overview in slug" check is a substring match. Document the
        # behavior so it's stable.
        r = ApiRoute.parse("/api/client-api/search/search-overview-page")
        assert r is not None
        assert r.is_overview is True


class TestApiRouteParseIndexingApi:
    """Flat 4-segment routes: /api/indexing-api/<slug>"""

    def test_parses_typical_endpoint(self) -> None:
        r = ApiRoute.parse("/api/indexing-api/add-or-update-datasource")
        assert r is not None
        assert r.api == "indexing-api"
        assert r.group is None
        assert r.slug == "add-or-update-datasource"

    def test_schema_dir_omits_group(self) -> None:
        r = ApiRoute.parse("/api/indexing-api/add-or-update-datasource")
        assert r is not None
        assert r.schema_dir == "indexing-api"

    def test_authentication_overview_recognized_as_overview(self) -> None:
        r = ApiRoute.parse("/api/indexing-api/authentication-overview")
        assert r is not None
        assert r.is_overview is True

    def test_non_overview_indexing_endpoint(self) -> None:
        r = ApiRoute.parse("/api/indexing-api/bulk-index-documents")
        assert r is not None
        assert r.is_overview is False


class TestApiRouteParseUnrecognized:
    """Routes that don't match either API shape return None."""

    @pytest.mark.parametrize(
        "route",
        [
            "",
            "/",
            "/guides/mcp",
            "/get-started/authentication",
            "/api",
            "/api/",
            "/api/client-api",                   # missing slug
            "/api/client-api/",                  # missing slug, trailing slash
            "/api/client-api/activity/feedback/extra",  # too deep
            "/changelog",
            "//api//client-api//activity//feedback",  # double slashes
            "not-even-a-path",
        ],
    )
    def test_returns_none(self, route: str) -> None:
        assert ApiRoute.parse(route) is None


class TestApiRouteFrozen:
    """The dataclass is frozen — equality and hashability matter."""

    def test_equal_when_fields_match(self) -> None:
        a = ApiRoute(api="client-api", group="activity", slug="feedback")
        b = ApiRoute(api="client-api", group="activity", slug="feedback")
        assert a == b

    def test_not_equal_when_group_differs(self) -> None:
        a = ApiRoute(api="client-api", group="activity", slug="feedback")
        b = ApiRoute(api="client-api", group="search", slug="feedback")
        assert a != b

    def test_hashable(self) -> None:
        # frozen=True implies hashable; allow use as dict keys / set members.
        a = ApiRoute(api="client-api", group="activity", slug="feedback")
        b = ApiRoute(api="client-api", group="activity", slug="feedback")
        assert {a, b} == {a}

    def test_immutable(self) -> None:
        r = ApiRoute(api="client-api", group="activity", slug="feedback")
        with pytest.raises(Exception):  # FrozenInstanceError; type varies by Python
            r.slug = "other"  # type: ignore[misc]
