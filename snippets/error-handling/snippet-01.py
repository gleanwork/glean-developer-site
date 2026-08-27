from glean.indexing.exceptions import GleanError

try:
    connector.index_data(mode=IndexingMode.FULL)
except GleanError as error:
    print(error)            # message + "How to fix:" + "Documentation:"
    print(error.fix_suggestion)
    print(error.docs_url)
