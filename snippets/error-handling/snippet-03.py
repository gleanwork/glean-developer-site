def get_source_data(self, **kwargs):
    for summary in self.list_articles():        # raises on failure — correct
        try:
            yield self.fetch_detail(summary["id"])
        except PullHttpError as error:
            if error.status_code == 404:
                logger.warning("Article %s vanished mid-crawl", summary["id"])
                continue
            raise
