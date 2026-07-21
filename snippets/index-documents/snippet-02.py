from glean.api_client import Glean
import os

with Glean(
    api_token=os.getenv("GLEAN_API_TOKEN", ""),
    server_url=os.getenv("GLEAN_SERVER_URL", ""),
) as client:
    # Index a document
    try:
        client.indexing.documents.index(request={
            "document": {
                "datasource": "gleantest",
                "objectType": "EngineeringDoc",
                "id": "blueskytest-1",
                "title": "This doc will help you get familiar with Blue Sky API",
                "viewURL": "https://bluesky.test/blueskytest-1",
                "body": {
                    "mimeType": "text/plain",
                    "textContent": "This doc will help you get familiar with Blue Sky API"
                },
                "permissions": {
                    "allowAnonymousAccess": True
                }
            }
        })
    except Exception as e:
        print(f"Exception when indexing document: {e}")
