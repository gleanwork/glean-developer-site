from glean.indexing.recipes.pull import (
    BasePullHttpStreamingDataClient,
    TokenBucketRateLimiter,
)


class ArticleDataClient(BasePullHttpStreamingDataClient[Article]):
    def __init__(self, token: str):
        super().__init__(
            base_url="https://api.example.com/v2",
            path="/articles",
            headers={"Authorization": f"Bearer {token}"},
            rate_limiter=TokenBucketRateLimiter(
                rate_per_second=10,
                capacity=20,
            ),
        )
