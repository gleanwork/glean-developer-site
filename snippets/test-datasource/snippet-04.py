from glean.api_client import Glean
import os

with Glean(
    api_token=os.getenv("GLEAN_INDEXING_API_TOKEN", ""),
    server_url=os.getenv("GLEAN_SERVER_URL", ""),
) as client:
    try:
        client.indexing.permissions.authorize_beta_users(
            datasource="gleantest",
            emails=[
                "user1@example.com",
                "user2@example.com",
            ],
        )
    except Exception as e:
        print(f"Exception when authorizing beta users: {e}")
