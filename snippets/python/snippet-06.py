# Simple chat
response = client.client.chat.create(
    messages=[{"fragments": [{"text": "Explain our Q4 strategy"}]}]
)

# Streaming chat: create_stream returns the streamed response as text
response = client.client.chat.create_stream(
    messages=[{"fragments": [{"text": "What are our priorities?"}]}]
)
print(response)
