import time

from glean.api_client import Glean, errors

def robust_search(glean, query: str, max_retries: int = 3):
    for attempt in range(max_retries):
        try:
            return glean.client.search.query(query=query)
        except errors.GleanError as e:
            if e.status_code == 429:  # Rate limited
                time.sleep(2 ** attempt)
                continue
            elif e.status_code >= 500:  # Server error
                if attempt < max_retries - 1:
                    time.sleep(1)
                    continue
            raise e

    raise Exception(f"Search failed after {max_retries} attempts")
