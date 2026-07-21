response = client.client.chat.create(
    messages=[{"fragments": [{"text": "Hello"}]}],
    http_headers={"X-Glean-Auth-Type": "OAUTH"}
)
