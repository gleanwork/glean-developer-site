#!/usr/bin/env python3

from data_clients import DeveloperDocsDataClient
from developer_docs_connector import CustomDeveloperDocsConnector
from glean.indexing.models import IndexingMode
import subprocess

try:
    developer_docs_data_client = DeveloperDocsDataClient("https://developers.glean.com")
    connector = CustomDeveloperDocsConnector(name="hierarchytest", data_client=developer_docs_data_client)

    connector.configure_datasource(is_test=True)
    connector.index_data(mode=IndexingMode.FULL)
    
    print("Indexing completed successfully!")
    
except Exception as e:
    print(f"Error occurred during indexing: {e}")
