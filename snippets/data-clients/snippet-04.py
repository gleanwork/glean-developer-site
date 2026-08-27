class ArticleDataClient(BasePullHttpStreamingDataClient[Article]):
    def get_source_data(self, **kwargs):
        for article in super().get_source_data(**kwargs):
            detail = self.http.get(f"/articles/{article['id']}")
            yield {**article, "body": detail.json_dict()["body"]}
