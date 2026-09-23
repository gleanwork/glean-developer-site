"""Tests for DeveloperDocsConnector against the SDK's recording mock client."""

from __future__ import annotations

from pathlib import Path

import pytest
from glean.api_client.models import DocCategory
from glean.indexing.cli.project import (
    instantiate_connector,
    load_connector,
    load_project_config,
)
from glean.indexing.connectors import BaseDataClient
from glean.indexing.models import ConnectorOptions
from glean.indexing.testing import mock_glean_client, run_connector

from data_client import DeveloperDocsDataClient
from developer_docs_connector import DeveloperDocsConnector, TooFewDocumentsError

INDEXING_DIR = Path(__file__).parent.parent


class SmallSiteConnector(DeveloperDocsConnector):
    """The fake repo has four pages; lower the floor so it can be indexed."""

    MIN_DOCUMENTS = 1


def _connector(repo: Path, cls: type[DeveloperDocsConnector] = SmallSiteConnector):
    return cls(DeveloperDocsDataClient(repo_root=str(repo)))


class TestIndexData:
    def test_full_crawl_posts_every_page_once(self, fake_repo: Path) -> None:
        client = run_connector(_connector(fake_repo))

        docs = client.documents_posted
        assert len(docs) == 4
        assert len({d.id for d in docs}) == 4
        assert {d.object_type for d in docs} == {"infoPage", "apiReference"}
        assert all(d.datasource == "devdocs" for d in docs)
        assert all(d.permissions.allow_anonymous_access for d in docs)

    def test_single_batch_replaces_the_datasource(self, fake_repo: Path) -> None:
        client = run_connector(_connector(fake_repo))

        (call,) = client.indexing.documents.bulk_index.call_args_list
        assert call.kwargs["is_first_page"] is True
        assert call.kwargs["is_last_page"] is True
        assert call.kwargs["disable_stale_document_deletion_check"] is None

    def test_disable_stale_deletion_check_reaches_last_page(self, fake_repo: Path) -> None:
        client = run_connector(
            _connector(fake_repo),
            options=ConnectorOptions(disable_stale_deletion_check=True),
        )

        last = client.indexing.documents.bulk_index.call_args_list[-1]
        assert last.kwargs["disable_stale_document_deletion_check"] is True


class TestMinimumDocumentGuard:
    def test_refuses_to_upload_a_suspiciously_small_crawl(self, fake_repo: Path) -> None:
        # Default floor (100) against the four-page fake repo.
        connector = _connector(fake_repo, DeveloperDocsConnector)

        with mock_glean_client() as client:
            with pytest.raises(TooFewDocumentsError, match="Refusing to index 4 pages"):
                connector.index_data()

        client.indexing.documents.bulk_index.assert_not_called()

    def test_refuses_an_empty_build(self, empty_repo: Path) -> None:
        docs_json = empty_repo / "build" / "mcp" / "docs.json"
        docs_json.parent.mkdir(parents=True, exist_ok=True)
        docs_json.write_text("{}")
        connector = _connector(empty_repo, DeveloperDocsConnector)

        with mock_glean_client() as client:
            with pytest.raises(TooFewDocumentsError):
                connector.index_data()

        client.indexing.documents.bulk_index.assert_not_called()


class TestCliContract:
    """What `glean-idx run` / `test` / `datasource configure` rely on."""

    def test_project_file_loads_the_connector_without_arguments(self) -> None:
        cls = load_connector(INDEXING_DIR, load_project_config(INDEXING_DIR))
        connector = instantiate_connector(cls)

        assert isinstance(connector, DeveloperDocsConnector)
        assert connector.name == "devdocs"

    def test_data_client_is_discoverable_by_the_test_harness(self) -> None:
        # `glean-idx test` finds clients by BaseDataClient type; --max-items
        # and --phase integration depend on it.
        assert isinstance(DeveloperDocsConnector().data_client, BaseDataClient)

    def test_repo_root_can_be_overridden_from_the_environment(
        self, fake_repo: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.setenv("DEVDOCS_REPO_ROOT", str(fake_repo))

        assert DeveloperDocsDataClient().repo_root == fake_repo


class TestMinimumDocumentGuardUnderTruncation:
    def test_judges_the_full_crawl_not_the_truncated_sample(self, fake_repo: Path) -> None:
        # `glean-idx test --max-items N` wraps the data client and slices its
        # result; the guard must still see the four pages actually read.
        class FloorOfFour(DeveloperDocsConnector):
            MIN_DOCUMENTS = 4

        connector = _connector(fake_repo, FloorOfFour)
        inner = connector.data_client

        class Truncating(BaseDataClient):
            """Shaped like the SDK harness wrapper: no attribute passthrough."""

            def get_source_data(self, **kwargs):
                return list(inner.get_source_data(**kwargs))[:1]

        connector.data_client = Truncating()

        assert len(connector.get_data()) == 1


class TestConfigureDatasource:
    def test_registers_both_object_types_as_knowledge_hub(self, fake_repo: Path) -> None:
        with mock_glean_client() as client:
            _connector(fake_repo).configure_datasource()

        kwargs = client.indexing.datasources.add.call_args.kwargs
        assert kwargs["name"] == "devdocs"
        assert [o.name for o in kwargs["object_definitions"]] == ["infoPage", "apiReference"]
        assert {o.doc_category for o in kwargs["object_definitions"]} == {
            DocCategory.KNOWLEDGE_HUB
        }
