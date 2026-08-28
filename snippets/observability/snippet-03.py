from glean.indexing.observability import ConnectorObservability, InMemoryMetricsProvider

observability = ConnectorObservability(
    connector_name="companywiki",
    datasource="companywiki",
    crawl_mode="full",
    metrics_provider=InMemoryMetricsProvider(),
)
