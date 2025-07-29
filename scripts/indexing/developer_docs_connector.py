from typing import Union, List
from collections import Counter

from glean.indexing.connectors import BaseDatasourceConnector
from glean.indexing.common.property_definition_builder import PropertyDefinitionBuilder
from glean.indexing.models import (
    ContentDefinition,
    CustomDatasourceConfig,
    DocumentDefinition,
    UserReferenceDefinition
)
from glean.api_client.models import (
    ObjectDefinition,
    PropertyDefinition,
    UIOptions,
    PropertyType,
    DatasourceCategory,
    CustomProperty,
    DocumentPermissionsDefinition
)
from data_types import DocumentationPage, ApiReferencePage

class CustomDeveloperDocsConnector(BaseDatasourceConnector[Union[DocumentationPage, ApiReferencePage]]):
    configuration: CustomDatasourceConfig = CustomDatasourceConfig(
        name="devDocs",
        display_name="Glean Developer Docs",
        datasource_category=DatasourceCategory.KNOWLEDGE_HUB,
        url_regex="https://developers.glean.com/.*",
        icon_url="data:image/png;base64,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",
        is_entity_datasource=False,
        is_test_datasource=True,
        is_user_referenced_by_email=True,
        object_definitions=[
                ObjectDefinition(
                    name="infoPage",
                    display_label="Information Page",
                    doc_category=DatasourceCategory.KNOWLEDGE_HUB,
                    property_definitions=PropertyDefinitionBuilder()
                        .add_property("docSection", "Section", property_type=PropertyType.TEXT, ui_options=UIOptions.SEARCH_RESULT)
                        .add_property("heading", "Heading", property_type=PropertyType.TEXT, ui_options=UIOptions.SEARCH_RESULT, hide_ui_facet=True)
                        .build()
                ),
                ObjectDefinition(
                    name="apiReference",
                    display_label="API Reference",
                    doc_category=DatasourceCategory.KNOWLEDGE_HUB,
                    property_definitions=PropertyDefinitionBuilder()
                        .add_property("apiTag", "API Tag", property_type=PropertyType.PICKLIST, ui_options=UIOptions.SEARCH_RESULT)
                        .add_property("endpoint", "Endpoint", property_type=PropertyType.TEXT, ui_options=UIOptions.SEARCH_RESULT, hide_ui_facet=True)
                        .add_property("method", "HTTP Method", property_type=PropertyType.PICKLIST, ui_options=UIOptions.SEARCH_RESULT, hide_ui_facet=True)
                        .add_property("requestContentType", "Request Content Type", property_type=PropertyType.PICKLIST, ui_options=UIOptions.SEARCH_RESULT, hide_ui_facet=True)
                        .add_property("requestParameters", "Request Parameters", property_type=PropertyType.TEXT, ui_options=UIOptions.SEARCH_RESULT, hide_ui_facet=True)
                        .add_property("requestBody", "Request Body", property_type=PropertyType.TEXT, ui_options=UIOptions.SEARCH_RESULT, hide_ui_facet=True)
                        .add_property("responseContentType", "Response Content Type", property_type=PropertyType.PICKLIST, ui_options=UIOptions.SEARCH_RESULT, hide_ui_facet=True)
                        .add_property("responseBody", "Response Body", property_type=PropertyType.TEXT, ui_options=UIOptions.SEARCH_RESULT, hide_ui_facet=True)
                        .add_property("responseCodes", "Response Codes", property_type=PropertyType.TEXTLIST, ui_options=UIOptions.SEARCH_RESULT, hide_ui_facet=True)
                        .add_property("authentication", "Authentication", property_type=PropertyType.PICKLIST, ui_options=UIOptions.SEARCH_RESULT, hide_ui_facet=True)
                        .add_property("pythonCodeSample", "Python Code Sample", property_type=PropertyType.TEXT, ui_options=UIOptions.SEARCH_RESULT, hide_ui_facet=True)
                        .add_property("goCodeSample", "Go Code Sample", property_type=PropertyType.TEXT, ui_options=UIOptions.SEARCH_RESULT, hide_ui_facet=True)
                        .add_property("javaCodeSample", "Java Code Sample", property_type=PropertyType.TEXT, ui_options=UIOptions.SEARCH_RESULT, hide_ui_facet=True)
                        .add_property("typescriptCodeSample", "TypeScript Code Sample", property_type=PropertyType.TEXT, ui_options=UIOptions.SEARCH_RESULT, hide_ui_facet=True)
                        .add_property("curlCodeSample", "Curl Code Sample", property_type=PropertyType.TEXT, ui_options=UIOptions.SEARCH_RESULT, hide_ui_facet=True)
                        .build()
                )
            ]
    )

    def transform(self, data: List[Union[DocumentationPage, ApiReferencePage]]) -> List[DocumentDefinition]:
        documents = []
        for page in data:
            if page["page_type"] == "info_page":
                document = DocumentDefinition(
                    id=page["id"],
                    title=page["title"],
                    datasource=self.name,
                    view_url=page["url"],
                    object_type="infoPage",
                    body=ContentDefinition(mime_type="text/plain", text_content=page["content"]),
                    custom_properties=[
                        CustomProperty(name="docSection", value=page["section"]),
                        CustomProperty(name="heading", value=page["heading"]),
                    ],
                    permissions=DocumentPermissionsDefinition(
                        allow_anonymous_access=True
                    )
                )
            elif page["page_type"] == "api_reference":
                document = DocumentDefinition(
                    id=page["id"],
                    title=page["title"],
                    datasource=self.name,
                    view_url=page["url"],
                    object_type="apiReference",
                    summary=ContentDefinition(mime_type="text/plain", text_content=page["description"]),
                    custom_properties=[
                        CustomProperty(name="apiTag", value=page["tag"]),
                        CustomProperty(name="endpoint", value=page["endpoint"]),
                        CustomProperty(name="method", value=page["method"]),
                        CustomProperty(name="requestContentType", value=page["request_content_type"]),
                        CustomProperty(name="requestParameters", value=page["request_parameters"]),
                        CustomProperty(name="requestBody", value=page["request_body"]),
                        CustomProperty(name="responseContentType", value=page["response_content_type"]),
                        CustomProperty(name="responseBody", value=page["response_body"]),
                        CustomProperty(name="responseCodes", value=page["response_codes"]),
                        CustomProperty(name="authentication", value=page["authentication"]),
                        CustomProperty(name="pythonCodeSample", value=page["python_code_sample"]),
                        CustomProperty(name="goCodeSample", value=page["go_code_sample"]),
                        CustomProperty(name="javaCodeSample", value=page["java_code_sample"]),
                        CustomProperty(name="typescriptCodeSample", value=page["typescript_code_sample"]),
                        CustomProperty(name="curlCodeSample", value=page["curl_code_sample"]),
                    ],
                    permissions=DocumentPermissionsDefinition(
                        allow_anonymous_access=True
                    )
                )
            documents.append(document)
        return documents
