import httpx
from a2a.client import A2ACardResolver

async with httpx.AsyncClient(headers={"Authorization": f"Bearer {token}"}) as httpx_client:
    resolver = A2ACardResolver(httpx_client, base_url, agent_card_path=card_path)
    card = await resolver.get_agent_card()
    assert "/a2a/agents/" in card.url
