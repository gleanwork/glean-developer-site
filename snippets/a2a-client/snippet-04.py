stream_client = ClientFactory(ClientConfig(httpx_client=httpx_client, streaming=True)).create(card)
async for event in stream_client.send_message(long_question):
    ...  # print incrementally as chunks arrive
