connector.index_data(mode=IndexingMode.FULL)
print(connector.observability.get_metrics_summary())
