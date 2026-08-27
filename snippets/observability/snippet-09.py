obs = connector.observability

obs.start_timer("enrichment")
enrich(documents)
obs.end_timer("enrichment")

obs.record_metric("enriched_documents", len(documents))
obs.increment_counter("enrichment_failures")
