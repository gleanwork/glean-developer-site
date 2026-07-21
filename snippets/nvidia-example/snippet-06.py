def glean_search(query, api_key, base_url, **kwargs):
    endpoint = f"{base_url}/search"

    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}

    payload = {
        "query": query,
        "pageSize": kwargs.get("page_size", 10),
        "requestOptions": {},
    }

    # Add optional parameters
    if "cursor" in kwargs:
        payload["cursor"] = kwargs["cursor"]

    if "facet_filters" in kwargs:
        payload["requestOptions"]["facetFilters"] = kwargs["facet_filters"]

    if "timeout_millis" in kwargs:
        payload["timeoutMillis"] = kwargs["timeout_millis"]

    try:
        response = requests.post(endpoint, json=payload, headers=headers)
        response.raise_for_status()

        data = response.json()

        result = {
            "status_code": response.status_code,
            "request_id": data.get("requestID"),
            "results": data.get("results", []),
            "facet_results": data.get("facetResults", []),
            "cursor": data.get("cursor"),
            "has_more_results": data.get("hasMoreResults", False),
            "tracking_token": data.get("trackingToken"),
            "backend_time_millis": data.get("backendTimeMillis"),
        }

        return result

    except requests.exceptions.RequestException as e:
        raise e
