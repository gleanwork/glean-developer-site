from glean.indexing.observability import ConnectorObservability, setup_connector_logging
from glean.indexing.observability.plugins.aws import (
    CloudWatchLogsProvider,
    CloudWatchMetricsProvider,
)

setup_connector_logging(
    "company_wiki",
    logger_provider=CloudWatchLogsProvider(
        log_group="/glean/connectors",
        log_stream="company_wiki",
        region_name="us-east-1",
    ),
)

observability = ConnectorObservability(
    connector_name="company_wiki",
    metrics_provider=CloudWatchMetricsProvider(
        namespace="GleanConnectors",
        region_name="us-east-1",
        dimensions={"connector": "company_wiki"},
    ),
)
