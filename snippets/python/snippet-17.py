from glean.api_client import Glean, errors
import os

with Glean(
    api_token=os.getenv("GLEAN_API_TOKEN"),
    server_url=os.getenv("GLEAN_SERVER_URL"),
) as client:
    try:
        response = client.client.search.query(
            query="quarterly business review",
            page_size=10,
        )
        print(response)
    except errors.GleanDataError as e:
        # 403 Permission Denied, 422 Invalid Query
        print(f"Data error: {e}")
    except errors.GleanError as e:
        # Base error for all other API errors (400, 401, 408, 429, 5XX)
        print(f"API error: {e}")
