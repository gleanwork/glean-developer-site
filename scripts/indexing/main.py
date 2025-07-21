#!/usr/bin/env python3
# /// script
# dependencies = [
#     "glean-indexing-sdk",
#     "requests",
#     "playwright",
#     "bs4",
# ]
# ///

from data_clients import DeveloperDocsDataClient
from developer_docs_connector import CustomDeveloperDocsConnector
from glean.indexing.models import IndexingMode

composite_client = DeveloperDocsDataClient("https://developers.glean.com")

connector = CustomDeveloperDocsConnector(name="customDeveloperDocsDatasource", data_client=composite_client)
connector.configure_datasource(is_test=True)

connector.index_data(mode=IndexingMode.FULL)
