from glean.api_client import Glean
import os

with Glean(
    api_token=os.getenv("GLEAN_INDEXING_API_TOKEN", ""),
    server_url=os.getenv("GLEAN_SERVER_URL", ""),
) as client:
    # Get datasource status
    try:
        res = client.indexing.datasource.status(datasource="gleantest")
        print(res)
    except Exception as e:
        print(f"Exception when getting datasource status: {e}")
