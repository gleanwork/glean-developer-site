class WikiConnector(BaseDatasourceConnector[WikiPage]):
    def _get_last_crawl_timestamp(self):
        # your storage: file, S3, DynamoDB, database
        return read_checkpoint("companywiki")

    def index_data(self, mode=IndexingMode.FULL, options=None):
        started_at = datetime.now(timezone.utc).isoformat()
        super().index_data(mode=mode, options=options)
        write_checkpoint("companywiki", started_at)  # only on success
