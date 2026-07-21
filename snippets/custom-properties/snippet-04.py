from glean.api_client import Glean, models
import os

with Glean(
    api_token=os.getenv("GLEAN_INDEXING_API_TOKEN", ""),
    server_url=os.getenv("GLEAN_SERVER_URL", ""),
) as client:
    try:
        # DocumentDefinition has many fields, we show the usage of a few basic ones.
        client.indexing.documents.add_or_update(
            document=models.DocumentDefinition(
                datasource="testDatasource",
                title="Account 1",
                id="Account_1",
                custom_properties=[
                    {"name": "priority", "value": "High"},
                ],
            )
        )
    except Exception as e:
        print(f"Exception when indexing document: {e}")
