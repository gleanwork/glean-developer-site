from glean.api_client import Glean
from glean.api_client.models import ContentType, Message, MessageTextBlock

glean = Glean(api_token=..., instance=...)

response = glean.client.agents.run(
    agent_id=agent_id,
    messages=[Message(role="USER", content=[MessageTextBlock(text=question, type=ContentType.TEXT)])],
    http_headers={"X-Glean-Act-As": "marcus.webb@acme.example.com"},
)

print(response.run.status)
for message in response.messages or []:
    print(message.role, "".join(b.text for b in message.content or []))
