def federated_search(query: str):
    # Search primary instance
    with Glean(api_token=primary_token, server_url=primary_url) as glean:
        primary_results = glean.client.search.query(query=query)

    # Search secondary instance
    with Glean(api_token=secondary_token, server_url=secondary_url) as glean:
        secondary_results = glean.client.search.query(query=query)

    # Combine result lists; each list arrives ranked by Glean already
    return (primary_results.results or []) + (secondary_results.results or [])
