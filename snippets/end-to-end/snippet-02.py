result = harness.run_end_to_end(
    mode=IndexingMode.FULL,
    confirm=True,
    allow_destructive=True,
    confirmed_target="https://test-company-be.glean.com",
)

if result is None:
    raise AssertionError("connector uploaded nothing")
