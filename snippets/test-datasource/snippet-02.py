from glean.api_client import Glean
import os

with Glean(
    api_token=os.getenv("GLEAN_INDEXING_API_TOKEN", ""),
    server_url=os.getenv("GLEAN_SERVER_URL", ""),
) as client:
    try:
        client.indexing.datasources.add(
            name="gleantest",
            # ... other fields
            is_test_datasource=True,
        )
    except Exception as e:
        print(f"Exception when adding datasource: {e}")
