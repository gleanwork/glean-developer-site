docs = result.documents_posted

assert [d.id for d in docs] == ["1", "2"]
assert docs[0].title == "Doc 1"
assert docs[0].body.text_content.startswith("Welcome")
assert docs[0].updated_at == 1769956200        # epoch seconds, not a string
