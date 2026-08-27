from glean.indexing.models import ConnectorOptions

connector.index_data(
    mode=IndexingMode.FULL,
    options=ConnectorOptions(force_restart=True),
)
