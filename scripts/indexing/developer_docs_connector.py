from typing import Union, Sequence, List

from glean.indexing.connectors import BaseDatasourceConnector
from glean.indexing.models import (
    # ContentDefinition,
    CustomDatasourceConfig,
    DocumentDefinition,
    # UserReferenceDefinition,
    # IndexingMode
)
from glean.api_client import models
from data_types import PageInfoData, ApiReferenceData

class CustomDeveloperDocsConnector(BaseDatasourceConnector[Union[PageInfoData, ApiReferenceData]]):
    configuration: CustomDatasourceConfig = CustomDatasourceConfig(
        name="customDeveloperDocsDatasource",
        display_name="Custom Glean Developer Docs",
        datasource_category="ENTITY",
        icon_url="https://glean-public-external-be.glean.com/api/v1/images?key=eyJ0eXBlIjoiVUdDIiwiaWQiOiIwIiwiZHMiOiJHQUxMRVJZLUlNQUdFLVBJQ0tFUiIsImNpZCI6ImVmNzI4NWM1LWY0ZjgtNDZhYi05NGQ3LTAxMjc4ZjhmNTAwMyIsImV4dCI6Ii5wbmcifQ==",
        is_entity_datasource=True,
        object_definitions=[
                models.ObjectDefinition(
                    name="infoPage",
                    display_label="Information Page",
                    doc_category=models.DatasourceCategory.KNOWLEDGE_HUB,
                    property_definitions=[
                        models.PropertyDefinition(name="docTitle", display_label="Title", property_type=models.PropertyType.TEXT, ui_options=models.UIOptions.SEARCH_RESULT, hide_ui_facet=True),
                        models.PropertyDefinition(name="docSection", display_label="Section", property_type=models.PropertyType.TEXT, ui_options=models.UIOptions.SEARCH_RESULT),
                        models.PropertyDefinition(name="heading", display_label="Heading", property_type=models.PropertyType.TEXT, ui_options=models.UIOptions.SEARCH_RESULT, hide_ui_facet=True),
                        models.PropertyDefinition(name="content", display_label="Content", property_type=models.PropertyType.TEXT, ui_options=models.UIOptions.SEARCH_RESULT, hide_ui_facet=True),
                    ]
                ),
                models.ObjectDefinition(
                    name="apiReference",
                    display_label="API Reference",
                    doc_category=models.DatasourceCategory.KNOWLEDGE_HUB,
                    property_definitions=[
                        models.PropertyDefinition(
                            name="apiTitle",
                            display_label="Title",
                            property_type=models.PropertyType.TEXT,
                            ui_options=models.UIOptions.SEARCH_RESULT,
                            hide_ui_facet=True
                        ),
                        models.PropertyDefinition(
                            name="apiTag",
                            display_label="API Tag",
                            property_type=models.PropertyType.PICKLIST,
                            ui_options=models.UIOptions.SEARCH_RESULT
                        ),
                        models.PropertyDefinition(
                            name="endpoint",
                            display_label="Endpoint",
                            property_type=models.PropertyType.TEXT,
                            ui_options=models.UIOptions.SEARCH_RESULT,
                            hide_ui_facet=True
                        ),
                        models.PropertyDefinition(
                            name="method",
                            display_label="HTTP Method",
                            property_type=models.PropertyType.PICKLIST,
                            ui_options=models.UIOptions.SEARCH_RESULT,
                        ),
                        models.PropertyDefinition(
                            name="requestContentType",
                            display_label="Request Content Type",
                            property_type=models.PropertyType.PICKLIST,
                            ui_options=models.UIOptions.SEARCH_RESULT
                        ),
                        models.PropertyDefinition(
                            name="requestParameters",
                            display_label="Request Parameters",
                            property_type=models.PropertyType.TEXT,
                            ui_options=models.UIOptions.SEARCH_RESULT,
                            hide_ui_facet=True
                        ),
                        models.PropertyDefinition(
                            name="requestBody",
                            display_label="Request Body",
                            property_type=models.PropertyType.TEXT,
                            ui_options=models.UIOptions.SEARCH_RESULT,
                            hide_ui_facet=True
                        ),
                        models.PropertyDefinition(
                            name="responseContentType",
                            display_label="Response Content Type",
                            property_type=models.PropertyType.PICKLIST,
                            ui_options=models.UIOptions.SEARCH_RESULT
                        ),
                        models.PropertyDefinition(
                            name="response",
                            display_label="Response",
                            property_type=models.PropertyType.TEXT,
                            ui_options=models.UIOptions.SEARCH_RESULT,
                            hide_ui_facet=True
                        ),
                        models.PropertyDefinition(
                            name="responseCodes",
                            display_label="Response Codes",
                            property_type=models.PropertyType.PICKLIST,
                            ui_options=models.UIOptions.SEARCH_RESULT
                        ),
                        models.PropertyDefinition(
                            name="authentication",
                            display_label="Authentication",
                            property_type=models.PropertyType.PICKLIST,
                            ui_options=models.UIOptions.SEARCH_RESULT
                        ),
                        models.PropertyDefinition(
                            name="pythonCodeSample",
                            display_label="Python Code Sample",
                            property_type=models.PropertyType.TEXT,
                            ui_options=models.UIOptions.SEARCH_RESULT,
                            hide_ui_facet=True
                        ),
                        models.PropertyDefinition(
                            name="goCodeSample",
                            display_label="Go Code Sample",
                            property_type=models.PropertyType.TEXT,
                            ui_options=models.UIOptions.SEARCH_RESULT,
                            hide_ui_facet=True
                        ),
                        models.PropertyDefinition(
                            name="javaCodeSample",
                            display_label="Java Code Sample",
                            property_type=models.PropertyType.TEXT,
                            ui_options=models.UIOptions.SEARCH_RESULT,
                            hide_ui_facet=True
                        ),
                        models.PropertyDefinition(
                            name="typescriptCodeSample",
                            display_label="TypeScript Code Sample",
                            property_type=models.PropertyType.TEXT,
                            ui_options=models.UIOptions.SEARCH_RESULT,
                            hide_ui_facet=True
                        ),
                        models.PropertyDefinition(
                            name="curlCodeSample",
                            display_label="Curl Code Sample",
                            property_type=models.PropertyType.TEXT,
                            ui_options=models.UIOptions.SEARCH_RESULT,
                            hide_ui_facet=True
                        ),
                    ]
                )
            ]
    )

    def transform(self, data: Sequence[Union[PageInfoData, ApiReferenceData]]) -> List[DocumentDefinition]:
        pass
