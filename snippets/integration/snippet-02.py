harness = TestHarness(
    connector=my_connector,
    clients={
        "data_client": articles_client,
        "comments_client": comments_client,
    },
)
