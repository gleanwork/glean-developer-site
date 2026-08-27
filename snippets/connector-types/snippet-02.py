from collections.abc import Generator

from glean.indexing.connectors import (
    BaseStreamingDataClient,
    BaseStreamingDatasourceConnector,
)


class ArticleDataClient(BaseStreamingDataClient[Article]):
    def get_source_data(self, **kwargs) -> Generator[Article, None, None]:
        page = 1
        while True:
            batch = fetch_page(page)
            if not batch:
                return
            yield from batch
            page += 1


class ArticleConnector(BaseStreamingDatasourceConnector[Article]):
    configuration = CustomDatasourceConfig(name="articles", display_name="Articles")

    def transform(self, data):
        return [to_document(article) for article in data]
