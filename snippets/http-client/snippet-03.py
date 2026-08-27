options = PullOptions(
    timeout_seconds=30.0,
    retries=PullRetryOptions(
        max_attempts=5,
        initial_backoff_seconds=1.0,
        max_backoff_seconds=60.0,
        backoff_multiplier=2.0,
        retry_status_codes={429, 500, 502, 503, 504},
        retry_connection_errors=True,
        respect_retry_after=True,
        jitter_seconds=1.0,
    ),
)
