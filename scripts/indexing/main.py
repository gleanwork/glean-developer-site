#!/usr/bin/env python3
# /// script
# dependencies = [
#     "glean-indexing-sdk",
# ]
# ///

from data_clients import InfoPageDataClient, ApiReferenceDataClient, CompositeDataClient
from developer_docs_connector import CustomDeveloperDocsConnector
from glean.indexing.models import IndexingMode

info_client = InfoPageDataClient()
api_client = ApiReferenceDataClient()
composite_client = CompositeDataClient(info_client, api_client, "https://developers.glean.com")

connector = CustomDeveloperDocsConnector(name="customDeveloperDocsDatasource", data_client=composite_client)
connector.configure_datasource(is_test=True)

# connector.index_data(mode=IndexingMode.FULL)
