from glean.indexing.testing import TestConfig, TestHarness

harness = TestHarness(
    connector=my_connector,
    config=TestConfig(),
    clients={"data_client": real_data_client},   # required for Phase 2 and 3
)
