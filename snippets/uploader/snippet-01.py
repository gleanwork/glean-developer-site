from glean.indexing.push import PushUploader

uploader = PushUploader(datasource="company_wiki")
uploader.bulk_index_documents(documents)
