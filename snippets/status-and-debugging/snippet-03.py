from glean.api_client.models import DebugDocumentRequest
from glean.indexing.testing import check_documents_status, poll_documents_status

snapshot = poll_documents_status(
    "companywiki",
    [DebugDocumentRequest(object_type="article", doc_id="page_123")],
)
print(snapshot.result)
