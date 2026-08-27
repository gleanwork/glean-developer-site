from glean.indexing.testing import assert_negative_identities_absent, extract_permission_refs

result = run_connector(connector)
refs = extract_permission_refs(result.documents_posted)

assert "engineering" in refs.group_ids
assert_negative_identities_absent(result.documents_posted, ["contractor@example.com"])
