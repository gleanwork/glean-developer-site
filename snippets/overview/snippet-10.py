def paginated_search(glean, query: str, page_size: int = 20):
    cursor = None
    all_results = []

    while True:
        response = glean.client.search.query(
            query=query,
            page_size=page_size,
            cursor=cursor,
        )
        all_results.extend(response.results or [])

        if not response.has_more_results:
            break

        cursor = response.cursor

    return all_results
