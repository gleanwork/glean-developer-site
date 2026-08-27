glean-idx doctor                    # are my credentials right?
glean-idx validate ./my-connector   # is the plan complete, before writing code?
glean-idx test --phase mock         # Glean mocked; connector source clients unchanged
glean-idx test --phase integration  # real source, recorded/replayed; Glean mocked
glean-idx run --mode incremental    # additive crawl for real
glean-idx datasource status --datasource company_wiki
glean-idx deploy init --cloud gcp   # Docker and Terraform for a CronJob
