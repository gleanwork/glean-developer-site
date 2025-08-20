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
        icon_url="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB8AAAAeCAYAAADU8sWcAAACY0lEQVR4Ae2XPW8TQRCG3z0bbAonFikokuIiAuIKhEkkp6BIIBTgBjs/wImgtfjqQoEFBakAIbkmOD8ABwpEQSBIpAhSkE1zfEkcEinSoCMpINje5WZhDx9RnEvhcwo/0sr74Z13ZnbOvmVo4LNIx3+ilkCLCIHbh9mTshozJVrFRp5zXEbrsYQmThrsqSXF39dTMwJiEgHhiNp7tUh/yBRndAg8QLBEa4JvaFqdteyMmyEET2gcLI42oGmsW0Mb6YjvbvHZexbMyrpnzqysYezggmyl4oqcmzr/FivWD182txVft2vS4K2rJnLjyx7Dc44gjakdOdaF6SumdCI7tuTLgabiZCB7asmNilj7XnX7zx6tys9efR/69KizVnP3ZYYWPft2JP765TcZAaWWSI72YHZ+GIYToRJQ0Z0+dwCx+B5M3z+KXP7QHyftqsxY4cZH7EhcRayMT1zSHeGkjFAx/3jV7aezfW4/d30AhYeD6HKcIQo3P8nmX/yL97xi3eFN31EpJYeMRMyzRnOxeMMeAf/iyZH9m7zPjb+RxSedczJilv8ex0iPZy89FZnBRU/WcvkB+BYn6BxLyyfcVFNxpYdeSaNUD4rMRK/bp2qnp0Jx7a6BqTvGVhLNq52EqcjIkUZKxa/uOmVJoY5L7ns+jOxFvZl5hLENZIiOgFKvhFTk/6ecqh0XnB+a24anOLeCmbXUJGNiBkHDsND5Y+mIByse4iijHQhU5KXhHT/7whmMIiAYmM01flymPcIiGSFQRDBYrI5/1yXFh1+phHOP0jlEa97lBaxoOFruZ3M2DX8DCtj6T6hFP/oAAAAASUVORK5CYII=",
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
                        .add_property("content", "Content", property_type=PropertyType.TEXT, ui_options=UIOptions.SEARCH_RESULT, hide_ui_facet=True)
                        .build()
                ),
                ObjectDefinition(
                    name="apiReference",
                    display_label="API Reference",
                    doc_category=DatasourceCategory.KNOWLEDGE_HUB,
                    property_definitions=PropertyDefinitionBuilder()
                        .add_property("apiTag", "API Tag", property_type=PropertyType.PICKLIST, ui_options=UIOptions.SEARCH_RESULT)
                        .add_property("endpoint", "Endpoint", property_type=PropertyType.TEXT, ui_options=UIOptions.SEARCH_RESULT, hide_ui_facet=True)
                        .add_property("endpointDescription", "Endpoint Description", property_type=PropertyType.TEXT, ui_options=UIOptions.SEARCH_RESULT, hide_ui_facet=True)
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
                    custom_properties=[
                        CustomProperty(name="docSection", value=page["section"]),
                        CustomProperty(name="heading", value=page["heading"]),
                        CustomProperty(name='content', value=page["content"])
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
                    custom_properties=[
                        CustomProperty(name="apiTag", value=page["tag"]),
                        CustomProperty(name="endpoint", value=page["endpoint"]),
                        CustomProperty(name="method", value=page["method"]),
                        CustomProperty(name="endpointDescription", value=page["description"]),
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
