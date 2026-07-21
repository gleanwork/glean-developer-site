from glean.api_client import Glean
import os

with Glean(
    api_token=os.getenv("GLEAN_INDEXING_API_TOKEN", ""),
    server_url=os.getenv("GLEAN_SERVER_URL", ""),
) as client:
    try:
        client.indexing.datasources.add(
            name="testDatasource",
            object_definitions=[
                {
                    "name": "Account",
                    "display_label": "Account",
                    "property_definitions": [
                        {
                            "name": "priority",
                            "display_label": "Priority",
                            "display_label_plural": "Priorities",
                            "property_type": "TEXT",
                            "hide_ui_facet": False,
                        }
                    ],
                }
            ],
        )
    except Exception as e:
        print(f"Exception when adding datasource: {e}")
