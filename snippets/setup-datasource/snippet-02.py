from glean.api_client import Glean
import os

with Glean(
    api_token=os.getenv("GLEAN_INDEXING_API_TOKEN", ""),
    server_url=os.getenv("GLEAN_SERVER_URL", ""),
) as client:
    # Create a datasource
    try:
        client.indexing.datasources.add(request={
            "name": "gleantest",
            "displayName": "Glean Test",
            "datasourceCategory": "PUBLISHED_CONTENT",
            "urlRegex": "^http://bluesky.test.*",
            "objectDefinitions": [
                {
                    "name": "EngineeringDoc",
                    "docCategory": "PUBLISHED_CONTENT"
                }
            ],
            "isUserReferencedByEmail": True
        })
    except Exception as e:
        print(f"Exception when creating datasource: {e}")
