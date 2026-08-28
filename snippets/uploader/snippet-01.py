from glean.indexing.push import PushUploader

uploader = PushUploader(datasource="companywiki")
uploader.bulk_index_documents(documents)
