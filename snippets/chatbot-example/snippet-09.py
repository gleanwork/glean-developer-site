# Use a specific agent for specialized responses
with Glean(api_token=api_token, server_url=server_url) as glean:
    response = glean.client.chat.create(
        messages=[
            {
                "fragments": [
                    models.ChatMessageFragment(
                        text="Help me write a technical document",
                    ),
                ],
            },
        ],
        agent_id="your-custom-agent-id",
    )
