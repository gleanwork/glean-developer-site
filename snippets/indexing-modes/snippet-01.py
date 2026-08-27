from glean.indexing.models import IndexingMode

connector.index_data(mode=IndexingMode.FULL)
connector.index_data(mode=IndexingMode.INCREMENTAL)
