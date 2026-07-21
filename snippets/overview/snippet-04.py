with Glean(api_token=api_token, server_url=server_url) as glean:
    autocomplete_response = glean.client.search.autocomplete(
        query="vacat",
        result_size=5,
    )

    for r in autocomplete_response.results or []:
        print(f"Suggestion: {r.result}")
