glean = Glean(api_token=..., instance=...)

response = glean.client.search.query(query=question, page_size=8)

sources = [
    {"title": r.title, "url": r.url, "text": "\n".join(s.text for s in r.snippets if s.text)}
    for r in response.results or []
    if r.title and r.snippets
]
