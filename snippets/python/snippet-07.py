results = client.client.search.query(
    query="quarterly business review",
    page_size=10
)

for result in results.results:
    print(f"Title: {result.title}")
    print(f"URL: {result.url}")
