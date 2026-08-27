from glean.indexing.testing import TestConfig, TestHarness

harness = TestHarness(
    connector=my_connector,
    config=TestConfig.from_yaml("testing_config.yaml"),
    clients={"data_client": real_data_client},
)

result = harness.run_integration_test()
result.assert_documents_posted()
