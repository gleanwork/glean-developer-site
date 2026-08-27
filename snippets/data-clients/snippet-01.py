from glean.indexing.connectors import BaseDataClient


class WikiDataClient(BaseDataClient[WikiPage]):
    def get_source_data(self, since=None, **kwargs):
        return fetch_all_pages()
