#!/usr/bin/env python3
# /// script
# dependencies = [
#     "glean-indexing-sdk",
# ]
# ///

from glean.api_client import Glean, models
import os

def main():
    with Glean(
        api_token=os.getenv("GLEAN_API_TOKEN", ""),
    ) as glean:
        
        glean.indexing.datasources.add(
            name="custom_developer_docs_datasource", 
            display_name="Glean Developer Docs",
            datasource_category=models.DatasourceCategory.ENTITY, 
            icon_url="https://glean-public-external-be.glean.com/api/v1/images?key=eyJ0eXBlIjoiVUdDIiwiaWQiOiIwIiwiZHMiOiJHQUxMRVJZLUlNQUdFLVBJQ0tFUiIsImNpZCI6ImVmNzI4NWM1LWY0ZjgtNDZhYi05NGQ3LTAxMjc4ZjhmNTAwMyIsImV4dCI6Ii5wbmcifQ==",
            is_entity_datasource=False, 
            is_test_datasource=False,
            object_definitions=[
                models.ObjectDefinition(
                    name="info_page",
                    display_label="Information Page",
                    doc_category=models.DatasourceCategory.KNOWLEDGE_HUB,
                    property_definitions=[
                        models.PropertyDefinition(name="title", display_label="Title", property_type=models.PropertyType.TEXT, ui_options=models.UIOptions.SEARCH_RESULT, hide_ui_facet=True),
                        models.PropertyDefinition(name="url", display_label="URL", property_type=models.PropertyType.TEXT, ui_options=models.UIOptions.SEARCH_RESULT, hide_ui_facet=True),
                        models.PropertyDefinition(name="section", display_label="Section", property_type=models.PropertyType.TEXT, ui_options=models.UIOptions.SEARCH_RESULT),
                        models.PropertyDefinition(name="heading", display_label="Heading", property_type=models.PropertyType.TEXT, ui_options=models.UIOptions.SEARCH_RESULT, hide_ui_facet=True),
                        models.PropertyDefinition(name="content", display_label="Content", property_type=models.PropertyType.TEXT, ui_options=models.UIOptions.SEARCH_RESULT, hide_ui_facet=True),
                    ]
                ),
                models.ObjectDefinition(
                    name="api_reference",
                    display_label="API Reference",
                    doc_category=models.DatasourceCategory.KNOWLEDGE_HUB,
                    property_definitions=[
                        models.PropertyDefinition(
                            name="title",
                            display_label="Title",
                            property_type=models.PropertyType.TEXT,
                            ui_options=models.UIOptions.SEARCH_RESULT,
                            hide_ui_facet=True
                        ),
                        models.PropertyDefinition(
                            name="tag",
                            display_label="API Tag",
                            property_type=models.PropertyType.TEXT,
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
                            name="url",
                            display_label="Full URL",
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
                            name="description",
                            display_label="Description",
                            property_type=models.PropertyType.TEXT,
                            ui_options=models.UIOptions.SEARCH_RESULT,
                            hide_ui_facet=True
                        ),
                        models.PropertyDefinition(
                            name="request_content_type",
                            display_label="Request Content Type",
                            property_type=models.PropertyType.TEXT,
                            ui_options=models.UIOptions.SEARCH_RESULT
                        ),
                        models.PropertyDefinition(
                            name="request_parameters",
                            display_label="Request Parameters",
                            property_type=models.PropertyType.TEXT,
                            ui_options=models.UIOptions.SEARCH_RESULT,
                            hide_ui_facet=True
                        ),
                        models.PropertyDefinition(
                            name="request_body",
                            display_label="Request Body",
                            property_type=models.PropertyType.TEXT,
                            ui_options=models.UIOptions.SEARCH_RESULT,
                            hide_ui_facet=True
                        ),
                        models.PropertyDefinition(
                            name="response_content_type",
                            display_label="Response Content Type",
                            property_type=models.PropertyType.TEXT,
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
                            name="response_codes",
                            display_label="Response Codes",
                            property_type=models.PropertyType.TEXT,
                            ui_options=models.UIOptions.SEARCH_RESULT
                        ),
                        models.PropertyDefinition(
                            name="authentication",
                            display_label="Authentication",
                            property_type=models.PropertyType.TEXT,
                            ui_options=models.UIOptions.SEARCH_RESULT
                        ),
                        models.PropertyDefinition(
                            name="code_examples",
                            display_label="Code Examples",
                            property_type=models.PropertyType.TEXT,
                            ui_options=models.UIOptions.SEARCH_RESULT,
                            hide_ui_facet=True
                        ),
                        models.PropertyDefinition(
                            name="supported_languages",
                            display_label="Supported Languages",
                            property_type=models.PropertyType.TEXT,
                            ui_options=models.UIOptions.SEARCH_RESULT
                        ),
                    ]
                )
            ]
        )
        
        print("Successfully created datasource configuration!")

if __name__ == "__main__":
    main()
