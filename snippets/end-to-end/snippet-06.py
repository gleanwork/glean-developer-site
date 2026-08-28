from glean.indexing.push import PushUploader

uploader = PushUploader(datasource="companywiki")
for doc_id in created_ids:
    uploader.delete_document(object_type="article", document_id=doc_id)
