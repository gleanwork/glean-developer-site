from glean.indexing.observability import ConnectorObservability, InMemoryMetricsProvider

observability = ConnectorObservability(
    connector_name="company_wiki",
    datasource="company_wiki",
    crawl_mode="full",
    metrics_provider=InMemoryMetricsProvider(),
)
