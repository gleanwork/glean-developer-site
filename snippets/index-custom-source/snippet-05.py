connector = AcmeCorpusConnector("acme_corpus", MyDataClient())
connector.configure_datasource()
connector.index_data()
