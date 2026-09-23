import logging
from typing import List, Optional, Sequence, Union

from glean.indexing.connectors import BaseDatasourceConnector
from glean.indexing.models import (
    ContentDefinition,
    CustomDatasourceConfig,
    DocumentDefinition,
)
from glean.api_client.models import (
    DatasourceCategory,
    DocCategory,
    DocumentPermissionsDefinition,
    ObjectDefinition,
)
from data_client import DeveloperDocsDataClient
from data_types import DocumentationPage, ApiReferencePage

# Under the "glean" namespace so the SDK logging setup (glean-idx run
# --log-level, setup_connector_logging) routes and levels these lines too.
logger = logging.getLogger("glean.devdocs.connector")

DATASOURCE_NAME = "devdocs"


class TooFewDocumentsError(RuntimeError):
    """Raised when a crawl returns fewer pages than the site can plausibly have."""


def _format_api_reference(page: ApiReferencePage) -> str:
    """Format an API reference page as a single coherent plain-text document.

    Assembles endpoint info, parameters, and request/response schemas into a
    readable document with clear headings.
    """
    sections = []

    sections.append(f"# {page['title']}")
    sections.append(f"\n## Endpoint\n{page['method']} {page['endpoint']}")

    if page.get("tag"):
        sections.append(f"API Group: {page['tag']}")

    if page.get("description"):
        sections.append(f"\n## Description\n{page['description']}")

    if page.get("request_content_type"):
        sections.append(f"\n## Request Content Type\n{page['request_content_type']}")

    if page.get("request_path_parameters"):
        sections.append(f"\n## Path Parameters\n{page['request_path_parameters']}")

    if page.get("request_query_parameters"):
        sections.append(f"\n## Query Parameters\n{page['request_query_parameters']}")

    if page.get("request_body"):
        sections.append(f"\n## Request Body\n{page['request_body']}")

    if page.get("response_content_type"):
        sections.append(f"\n## Response Content Type\n{page['response_content_type']}")

    if page.get("response_body"):
        sections.append(f"\n## Response Body\n{page['response_body']}")

    if page.get("response_codes"):
        codes = page["response_codes"]
        if isinstance(codes, list) and codes:
            sections.append("\n## Response Codes\n" + "\n".join(f"- {c}" for c in codes))

    return "\n".join(sections)


class DeveloperDocsConnector(BaseDatasourceConnector[Union[DocumentationPage, ApiReferencePage]]):
    # Every run is a FULL crawl, which replaces the datasource contents. A
    # broken build (empty docs.json, a filtering regression) would otherwise
    # upload an empty or tiny batch and mark every other page stale. The site
    # has ~380 pages; refuse to upload far fewer than that.
    MIN_DOCUMENTS = 100

    configuration: CustomDatasourceConfig = CustomDatasourceConfig(
        name=DATASOURCE_NAME,
        display_name="Glean Developer Docs",
        datasource_category=DatasourceCategory.KNOWLEDGE_HUB,
        url_regex="https://developers.glean.com/.*",
        icon_url="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB8AAAAeCAYAAADU8sWcAAACY0lEQVR4Ae2XPW8TQRCG3z0bbAonFikokuIiAuIKhEkkp6BIIBTgBjs/wImgtfjqQoEFBakAIbkmOD8ABwpEQSBIpAhSkE1zfEkcEinSoCMpINje5WZhDx9RnEvhcwo/0sr74Z13ZnbOvmVo4LNIx3+ilkCLCIHbh9mTshozJVrFRp5zXEbrsYQmThrsqSXF39dTMwJiEgHhiNp7tUh/yBRndAg8QLBEa4JvaFqdteyMmyEET2gcLI42oGmsW0Mb6YjvbvHZexbMyrpnzqysYezggmyl4oqcmzr/FivWD182txVft2vS4K2rJnLjyx7Dc44gjakdOdaF6SumdCI7tuTLgabiZCB7asmNilj7XnX7zx6tys9efR/69KizVnP3ZYYWPft2JP765TcZAaWWSI72YHZ+GIYToRJQ0Z0+dwCx+B5M3z+KXP7QHyftqsxY4cZH7EhcRayMT1zSHeGkjFAx/3jV7aezfW4/d30AhYeD6HKcIQo3P8nmX/yL97xi3eFN31EpJYeMRMyzRnOxeMMeAf/iyZH9m7zPjb+RxSedczJilv8ex0iPZy89FZnBRU/WcvkB+BYn6BxLyyfcVFNxpYdeSaNUD4rMRK/bp2qnp0Jx7a6BqTvGVhLNq52EqcjIkUZKxa/uOmVJoY5L7ns+jOxFvZl5hLENZIiOgFKvhFTk/6ecqh0XnB+a24anOLeCmbXUJGNiBkHDsND5Y+mIByse4iijHQhU5KXhHT/7whmMIiAYmM01flymPcIiGSFQRDBYrI5/1yXFh1+phHOP0jlEa97lBaxoOFruZ3M2DX8DCtj6T6hFP/oAAAAASUVORK5CYII=",
        is_entity_datasource=False,
        is_test_datasource=False,
        is_user_referenced_by_email=True,
        object_definitions=[
            ObjectDefinition(
                name="infoPage",
                display_label="Information Page",
                doc_category=DocCategory.KNOWLEDGE_HUB,
            ),
            ObjectDefinition(
                name="apiReference",
                display_label="API Reference",
                doc_category=DocCategory.KNOWLEDGE_HUB,
            ),
        ],
    )

    def __init__(self, data_client: Optional[DeveloperDocsDataClient] = None) -> None:
        # Zero-argument construction is what lets `glean-idx run` / `test` /
        # `datasource configure` load the connector from glean_deployment.yaml.
        super().__init__(DATASOURCE_NAME, data_client or DeveloperDocsDataClient())
        # The test harness may swap self.data_client for a wrapper that caps
        # results; keep the real reader to judge the full crawl size.
        self._source = self.data_client

    def get_data(
        self, since: Optional[str] = None
    ) -> Sequence[Union[DocumentationPage, ApiReferencePage]]:
        pages = super().get_data(since)
        # Judge the build by what was actually read from it, not by what a
        # test harness chose to keep (`glean-idx test --max-items 5`).
        fetched = getattr(self._source, "last_fetch_count", None)
        found = len(pages) if fetched is None else fetched
        if found < self.MIN_DOCUMENTS:
            raise TooFewDocumentsError(
                f"Refusing to index {found} pages: expected at least "
                f"{self.MIN_DOCUMENTS}. A FULL upload replaces the datasource, so "
                "this would mark the rest of the site stale. Check the site build."
            )
        return pages

    def transform(
        self, data: List[Union[DocumentationPage, ApiReferencePage]]
    ) -> List[DocumentDefinition]:
        documents = []
        for page in data:
            if page["page_type"] == "info_page":
                body_text = page["content"]
            elif page["page_type"] == "api_reference":
                body_text = _format_api_reference(page)
            else:
                continue

            document = DocumentDefinition(
                id=page["id"],
                title=page["title"],
                datasource=self.name,
                view_url=page["url"],
                object_type="infoPage" if page["page_type"] == "info_page" else "apiReference",
                body=ContentDefinition(
                    mime_type="text/plain",
                    text_content=body_text,
                ),
                permissions=DocumentPermissionsDefinition(
                    allow_anonymous_access=True
                ),
                created_at=page.get("created_at"),
                updated_at=page.get("updated_at"),
            )
            documents.append(document)
        return documents
