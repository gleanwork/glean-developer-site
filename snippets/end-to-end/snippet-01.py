from glean.indexing.models import IndexingMode
from glean.indexing.testing import TestConfig, TestHarness

harness = TestHarness(
    connector=my_connector,
    config=TestConfig.from_yaml("testing_config.yaml"),
    clients={"data_client": real_data_client},
)

result = harness.run_end_to_end(
    mode=IndexingMode.FULL,
    confirm=True,
    allow_destructive=True,
    confirmed_target="https://test-company-be.glean.com",
)
