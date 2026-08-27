from glean.indexing.testing import extract_permission_refs

result = harness.run_integration_test()
refs = extract_permission_refs(result.documents_posted)

assert "engineering" in refs.group_ids
assert "contractor@example.com" not in refs.user_ids
