from typing import Union, Sequence, List
from collections import Counter

from glean.indexing.connectors import BaseDatasourceConnector
from glean.indexing.models import (
    ContentDefinition,
    CustomDatasourceConfig,
    DocumentDefinition,
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
from data_types import PageInfoData, ApiReferenceData

class CustomDeveloperDocsConnector(BaseDatasourceConnector[Union[PageInfoData, ApiReferenceData]]):
    configuration: CustomDatasourceConfig = CustomDatasourceConfig(
        name="customDeveloperDocsDatasource",
        display_name="Custom Glean Developer Docs",
        datasource_category="ENTITY",
        icon_url="https://glean-public-external-be.glean.com/api/v1/images?key=eyJ0eXBlIjoiVUdDIiwiaWQiOiIwIiwiZHMiOiJHQUxMRVJZLUlNQUdFLVBJQ0tFUiIsImNpZCI6ImVmNzI4NWM1LWY0ZjgtNDZhYi05NGQ3LTAxMjc4ZjhmNTAwMyIsImV4dCI6Ii5wbmcifQ==",
        is_entity_datasource=True,
        is_test_datasource=True,
        is_user_referenced_by_email=True,
        object_definitions=[
                ObjectDefinition(
                    name="infoPage",
                    display_label="Information Page",
                    doc_category=DatasourceCategory.KNOWLEDGE_HUB,
                    property_definitions=[
                        PropertyDefinition(name="docSection", display_label="Section", property_type=PropertyType.TEXT, ui_options=UIOptions.SEARCH_RESULT),
                        PropertyDefinition(name="heading", display_label="Heading", property_type=PropertyType.TEXT, ui_options=UIOptions.SEARCH_RESULT, hide_ui_facet=True),
                    ]
                ),
                ObjectDefinition(
                    name="apiReference",
                    display_label="API Reference",
                    doc_category=DatasourceCategory.KNOWLEDGE_HUB,
                    property_definitions=[
                        PropertyDefinition(
                            name="apiTag",
                            display_label="API Tag",
                            property_type=PropertyType.PICKLIST,
                            ui_options=UIOptions.SEARCH_RESULT
                        ),
                        PropertyDefinition(
                            name="endpoint",
                            display_label="Endpoint",
                            property_type=PropertyType.TEXT,
                            ui_options=UIOptions.SEARCH_RESULT,
                            hide_ui_facet=True
                        ),
                        PropertyDefinition(
                            name="method",
                            display_label="HTTP Method",
                            property_type=PropertyType.PICKLIST,
                            ui_options=UIOptions.SEARCH_RESULT,
                        ),
                        PropertyDefinition(
                            name="requestContentType",
                            display_label="Request Content Type",
                            property_type=PropertyType.PICKLIST,
                            ui_options=UIOptions.SEARCH_RESULT
                        ),
                        PropertyDefinition(
                            name="requestParameters",
                            display_label="Request Parameters",
                            property_type=PropertyType.TEXT,
                            ui_options=UIOptions.SEARCH_RESULT,
                            hide_ui_facet=True
                        ),
                        PropertyDefinition(
                            name="requestBody",
                            display_label="Request Body",
                            property_type=PropertyType.TEXT,
                            ui_options=UIOptions.SEARCH_RESULT,
                            hide_ui_facet=True
                        ),
                        PropertyDefinition(
                            name="responseContentType",
                            display_label="Response Content Type",
                            property_type=PropertyType.PICKLIST,
                            ui_options=UIOptions.SEARCH_RESULT
                        ),
                        PropertyDefinition(
                            name="responseBody",
                            display_label="Response Body",
                            property_type=PropertyType.TEXT,
                            ui_options=UIOptions.SEARCH_RESULT,
                            hide_ui_facet=True
                        ),
                        PropertyDefinition(
                            name="responseCodes",
                            display_label="Response Codes",
                            property_type=PropertyType.PICKLIST,
                            ui_options=UIOptions.SEARCH_RESULT
                        ),
                        PropertyDefinition(
                            name="authentication",
                            display_label="Authentication",
                            property_type=PropertyType.PICKLIST,
                            ui_options=UIOptions.SEARCH_RESULT
                        ),
                        PropertyDefinition(
                            name="pythonCodeSample",
                            display_label="Python Code Sample",
                            property_type=PropertyType.TEXT,
                            ui_options=UIOptions.SEARCH_RESULT,
                            hide_ui_facet=True
                        ),
                        PropertyDefinition(
                            name="goCodeSample",
                            display_label="Go Code Sample",
                            property_type=PropertyType.TEXT,
                            ui_options=UIOptions.SEARCH_RESULT,
                            hide_ui_facet=True
                        ),
                        PropertyDefinition(
                            name="javaCodeSample",
                            display_label="Java Code Sample",
                            property_type=PropertyType.TEXT,
                            ui_options=UIOptions.SEARCH_RESULT,
                            hide_ui_facet=True
                        ),
                        PropertyDefinition(
                            name="typescriptCodeSample",
                            display_label="TypeScript Code Sample",
                            property_type=PropertyType.TEXT,
                            ui_options=UIOptions.SEARCH_RESULT,
                            hide_ui_facet=True
                        ),
                        PropertyDefinition(
                            name="curlCodeSample",
                            display_label="Curl Code Sample",
                            property_type=PropertyType.TEXT,
                            ui_options=UIOptions.SEARCH_RESULT,
                            hide_ui_facet=True
                        ),
                    ]
                )
            ]
    )

    def transform(self, data: Sequence[Union[PageInfoData, ApiReferenceData]]) -> List[DocumentDefinition]:
        
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
        print(documents)
        return documents
