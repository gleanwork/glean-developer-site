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
        name="hierarchytest",
        display_name="Glean Developer Docs Hierarchy Test",
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
                        .add_property("requestQueryParameters", "Request Query Parameters", property_type=PropertyType.TEXT, ui_options=UIOptions.SEARCH_RESULT, hide_ui_facet=True)
                        .add_property("requestPathParameters", "Request Path Parameters", property_type=PropertyType.TEXT, ui_options=UIOptions.SEARCH_RESULT, hide_ui_facet=True)
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
                        CustomProperty(name="requestQueryParameters", value=page["request_query_parameters"]),
                        CustomProperty(name="requestPathParameters", value=page["request_path_parameters"]),
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
