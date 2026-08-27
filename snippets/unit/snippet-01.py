from glean.indexing.testing import StaticDataClient, run_connector

result = run_connector(
    MyConnector("my_ds", StaticDataClient([
        {"id": "1", "title": "Doc 1", "url": "https://example.com/1"},
        {"id": "2", "title": "Doc 2", "url": "https://example.com/2"},
    ]))
)

result.assert_documents_posted(count=2, datasource="my_ds")
