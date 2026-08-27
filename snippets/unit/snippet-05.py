from glean.indexing.models import ConnectorOptions, IndexingMode

result = run_connector(
    connector,
    mode=IndexingMode.INCREMENTAL,
    options=ConnectorOptions(force_restart=True),
)
