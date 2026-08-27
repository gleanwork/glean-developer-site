class WikiDataClient(BaseDataClient[WikiPage]):
    def get_source_data(self, since=None, **kwargs):
        if since:
            return fetch_pages_modified_after(since)
        return fetch_all_pages()
