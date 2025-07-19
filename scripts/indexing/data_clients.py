from typing import Sequence, Union

from glean.indexing.connectors.base_data_client import BaseConnectorDataClient
from data_types import PageInfoData, ApiReferenceData

class DeveloperDocsDataClient(BaseConnectorDataClient[Union[PageInfoData, ApiReferenceData]]):
    def __init__(self, dev_docs_base_url: str):
        self.dev_docs_base_url = dev_docs_base_url

    def get_source_data(self, since=None) -> Sequence[Union[PageInfoData, ApiReferenceData]]:
        return []
