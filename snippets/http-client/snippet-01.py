from glean.indexing.recipes.pull import PullHttpClient, PullOptions

with PullHttpClient(
    base_url="https://api.example.com/v2",
    headers={"Authorization": f"Bearer {token}"},
    options=PullOptions(timeout_seconds=30.0),
) as http:
    response = http.get("/articles", params={"limit": 100})
    articles = response.json_dict()["items"]
