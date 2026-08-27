# Give large batches longer.
connector.index_data(options=ConnectorOptions(upload_timeout_ms=120_000))

# Or make the batches smaller.
connector.batch_size = 250
