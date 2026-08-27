from glean.indexing.testing import mock_glean_client

with mock_glean_client() as client:
    connector.configure_datasource()
    connector.index_data(mode=IndexingMode.INCREMENTAL)

    client.assert_datasource_configured(name="my_ds")
    client.assert_documents_posted(count=2)
