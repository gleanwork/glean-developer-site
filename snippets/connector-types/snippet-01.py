class WikiDataClient(BaseDataClient[WikiPage]):
    def get_source_data(self, since=None, **kwargs):
        return fetch_all_pages()


class WikiConnector(BaseDatasourceConnector[WikiPage]):
    configuration = CustomDatasourceConfig(name="wiki", display_name="Wiki")

    def transform(self, data):
        return [to_document(page) for page in data]
