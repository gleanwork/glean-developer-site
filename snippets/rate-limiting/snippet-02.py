shared = TokenBucketRateLimiter(rate_per_second=10, capacity=20)

articles = ArticleDataClient(token, rate_limiter=shared)
comments = CommentDataClient(token, rate_limiter=shared)
