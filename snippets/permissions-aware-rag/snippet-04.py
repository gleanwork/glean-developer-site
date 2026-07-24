response = glean.client.search.query(
    query=question,
    page_size=8,
    http_headers={"X-Glean-Act-As": "marcus.webb@acme.example.com"},
)
