from a2a.client import ClientConfig, ClientFactory
from a2a.client.helpers import create_text_message_object
from a2a.types import Message, Role

client = ClientFactory(ClientConfig(httpx_client=httpx_client, streaming=False)).create(card)
question = create_text_message_object(role=Role.user, content="Who owns the payments service?")

context_id = None
async for event in client.send_message(question):
    message = event if isinstance(event, Message) else event[0].history[-1]
    context_id = message.context_id
    print("".join(p.root.text for p in message.parts if p.root.kind == "text"))

follow_up = create_text_message_object(role=Role.user, content="Who's on call for it this week?")
follow_up.context_id = context_id
async for event in client.send_message(follow_up):
    ...  # same context — the agent remembers turn 1
