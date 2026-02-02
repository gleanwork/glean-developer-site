from typing import Union, List, Sequence

from glean.indexing.connectors import BaseAsyncStreamingDatasourceConnector
from glean.indexing.models import (
    ContentDefinition,
    CustomDatasourceConfig,
    DocumentDefinition,
)
from glean.api_client.models import (
    ObjectDefinition,
    DatasourceCategory,
    DocumentPermissionsDefinition,
)
from data_types import DocumentationPage, ApiReferencePage


def _format_api_reference(page: ApiReferencePage) -> str:
    """Format an API reference page as a single coherent plain-text document.

    Assembles all extracted data (endpoint info, parameters, schemas,
    code samples) into a readable document with clear headings.
    """
    sections = []

    sections.append(f"# {page['title']}")
    sections.append(f"\n## Endpoint\n{page['method']} {page['endpoint']}")

    if page.get("tag"):
        sections.append(f"API Group: {page['tag']}")

    if page.get("description"):
        sections.append(f"\n## Description\n{page['description']}")

    if page.get("authentication"):
        sections.append(f"\n## Authentication\n{page['authentication']}")

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

    # Include all code samples
    samples = [
        ("Python", page.get("python_code_sample")),
        ("TypeScript", page.get("typescript_code_sample")),
        ("Go", page.get("go_code_sample")),
        ("Java", page.get("java_code_sample")),
        ("cURL", page.get("curl_code_sample")),
    ]
    for lang, code in samples:
        if code:
            sections.append(f"\n## {lang} Example\n{code}")

    return "\n".join(sections)


class DeveloperDocsConnector(BaseAsyncStreamingDatasourceConnector[Union[DocumentationPage, ApiReferencePage]]):
    configuration: CustomDatasourceConfig = CustomDatasourceConfig(
        name="devdocs",
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
                doc_category=DatasourceCategory.KNOWLEDGE_HUB,
            ),
            ObjectDefinition(
                name="apiReference",
                display_label="API Reference",
                doc_category=DatasourceCategory.KNOWLEDGE_HUB,
            ),
        ],
    )

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
            )
            documents.append(document)
        return documents
