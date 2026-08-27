import pytest

from glean.indexing.testing import StaticAsyncStreamingDataClient, run_connector_async


@pytest.mark.asyncio
async def test_async_connector():
    result = await run_connector_async(
        MyAsyncConnector("my_ds", StaticAsyncStreamingDataClient(fixtures))
    )
    result.assert_documents_posted(count=10)
