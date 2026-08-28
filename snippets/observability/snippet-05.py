from glean.indexing.observability import ConnectorObservability, setup_connector_logging
from glean.indexing.observability.plugins.aws import (
    CloudWatchLogsProvider,
    CloudWatchMetricsProvider,
)

setup_connector_logging(
    "companywiki",
    logger_provider=CloudWatchLogsProvider(
        log_group="/glean/connectors",
        log_stream="companywiki",
        region_name="us-east-1",
    ),
)

observability = ConnectorObservability(
    connector_name="companywiki",
    metrics_provider=CloudWatchMetricsProvider(
        namespace="GleanConnectors",
        region_name="us-east-1",
        dimensions={"connector": "companywiki"},
    ),
)
