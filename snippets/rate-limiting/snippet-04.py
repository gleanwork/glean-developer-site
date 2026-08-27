super().__init__(
    base_url="https://api.example.com/v2",
    path="/articles",
    rate_limiter=TokenBucketRateLimiter(rate_per_second=10, capacity=20),
    options=PullOptions(
        retries=PullRetryOptions(max_attempts=5, respect_retry_after=True),
    ),
)
