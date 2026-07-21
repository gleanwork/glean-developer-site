# Search with additional parameters
documents = retriever.invoke(
    "quarterly sales report",
    page_size=5,  # Number of results to return
    disable_spellcheck=True,  # Disable spellcheck
    max_snippet_size=200  # Maximum snippet size
)
