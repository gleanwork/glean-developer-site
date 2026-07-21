# Initialize with custom settings
retriever = GleanSearchRetriever(
    server_url="https://your-server-id-be.glean.com",  # Override environment variable
    api_token="your-api-token",  # Override environment variable
    act_as="user@example.com",   # Override environment variable
    page_size=10,               # Default number of results
    max_snippet_size=300        # Default snippet size
)
