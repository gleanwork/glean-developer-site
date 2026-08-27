try:
    connector.index_data(mode=IndexingMode.FULL)
finally:
    data_client.close()
