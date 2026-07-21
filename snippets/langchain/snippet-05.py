from langchain_glean.retrievers import GleanSearchRetriever

# Initialize the retriever (will use environment variables)
retriever = GleanSearchRetriever()

# Search for documents
documents = retriever.invoke("quarterly sales report")

# Process the results
for doc in documents:
    print(f"Title: {doc.metadata.get('title')}")
    print(f"URL: {doc.metadata.get('url')}")
    print(f"Content: {doc.page_content}")
    print("---")
