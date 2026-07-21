from glean.api_client import Glean
import os

with Glean(
    api_token=os.getenv("GLEAN_INDEXING_API_TOKEN", ""),
    server_url=os.getenv("GLEAN_SERVER_URL", ""),
) as client:
    # Bulk index documents
    try:
        client.indexing.documents.bulk_index(request={
            "uploadId": "test-upload-id",
            "datasource": "gleantest",
            "documents": [{
                "datasource": "gleantest",
                "objectType": "EngineeringDoc",
                "id": "test-doc-1",
                "title": "How to bulk index documents",
                "body": {
                    "mimeType": "text/plain",
                    "textContent": "This doc will help you make your first successful bulk index document request"
                },
                "permissions": {
                    "allowAnonymousAccess": True
                },
                "viewURL": "https://www.glean.engineering.co.in/test-doc-1",
                "customProperties": [
                    {
                        "name": "Org",
                        "value": "Infrastructure"
                    }
                ]
            }],
            "isFirstPage": True,
            "isLastPage": True,
            "forceRestartUpload": True
        })
    except Exception as e:
        print(f"Exception when bulk indexing documents: {e}")
