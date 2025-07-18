from typing import Sequence, Union

from glean.indexing.connectors.base_data_client import BaseConnectorDataClient
from data_types import PageInfoData, ApiReferenceData

class InfoPageDataClient(BaseConnectorDataClient[PageInfoData]):
    def __init__(self):
        pass

    def get_source_data(self, since=None) -> Sequence[PageInfoData]:
        return []

class ApiReferenceDataClient(BaseConnectorDataClient[ApiReferenceData]):
    def __init__(self):
        pass

    def get_source_data(self, since=None) -> Sequence[ApiReferenceData]:
        return []

class CompositeDataClient(BaseConnectorDataClient[Union[PageInfoData, ApiReferenceData]]):
    def __init__(self, info_client: InfoPageDataClient, api_client: ApiReferenceDataClient, dev_docs_base_url: str):
        self.info_client = info_client
        self.api_client = api_client
        self.dev_docs_base_url = dev_docs_base_url

    def get_source_data(self, since=None) -> Sequence[Union[PageInfoData, ApiReferenceData]]:
        return list(self.info_client.get_source_data(since)) + list(self.api_client.get_source_data(since))
