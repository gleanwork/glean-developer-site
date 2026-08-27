class ArticleDataClient(BasePullHttpStreamingDataClient[Article]):
    def get_source_data(self, **kwargs):
        page = 1
        while True:
            response = self.http.get(self.path, params={"page": page, "per_page": 100})
            body = response.json_dict()
            yield from body["items"]
            if not body.get("has_more"):
                return
            page += 1
