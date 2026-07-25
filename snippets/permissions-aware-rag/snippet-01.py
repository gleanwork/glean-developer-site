glean = Glean(api_token=..., instance=...)

response = glean.search.query(query=question, page_size=8)

sources = [
    {"title": r.title, "url": r.url, "text": "\n".join(s for s in r.snippets if s)}
    for r in response.results or []
    if r.title and r.snippets
]
