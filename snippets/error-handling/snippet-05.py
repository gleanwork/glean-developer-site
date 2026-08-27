try:
    connector.index_data(mode=IndexingMode.FULL)
except Exception:
    logger.exception("Crawl failed")
    raise                      # let the scheduler see a non-zero exit
