from glean.api_client import Glean
import os

with Glean(
    api_token=os.getenv("GLEAN_INDEXING_API_TOKEN", ""),
    server_url=os.getenv("GLEAN_SERVER_URL", ""),
) as client:
    try:
        res = client.indexing.documents.count(datasource="gleantest")
        print(res)
    except Exception as e:
        print(f"Exception when getting document count: {e}")
