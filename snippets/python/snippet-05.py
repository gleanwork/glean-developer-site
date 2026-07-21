from glean.api_client import Glean
import os

with Glean(
    api_token=os.getenv("GLEAN_API_TOKEN"),
    server_url=os.getenv("GLEAN_SERVER_URL"),
) as client:
    response = client.client.chat.create(
        messages=[{
            "fragments": [{"text": "What are our company values?"}]
        }],
        timeout_millis=30000
    )
    print(response)
