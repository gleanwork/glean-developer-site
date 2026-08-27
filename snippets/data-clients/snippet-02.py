from glean.indexing.recipes.pull import BasePullHttpStreamingDataClient, PullOptions


class ArticleDataClient(BasePullHttpStreamingDataClient[Article]):
    def __init__(self, token: str):
        super().__init__(
            base_url="https://api.example.com/v2",
            path="/articles",
            items_key="items",
            pagination="link",
            page_size=100,
            headers={"Authorization": f"Bearer {token}"},
            options=PullOptions(timeout_seconds=30.0),
        )
