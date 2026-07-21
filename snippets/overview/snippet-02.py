from glean.api_client import Glean, models

with Glean(api_token=api_token, server_url=server_url) as glean:
    response = glean.client.search.query(
        query="quarterly results",
        page_size=10,
        request_options=models.SearchRequestOptions(
            facet_bucket_size=10,
            facet_filters=[
                models.FacetFilter(
                    field_name="app",
                    values=[
                        models.FacetFilterValue(
                            value="confluence",
                            relation_type=models.RelationType.EQUALS,
                        ),
                        models.FacetFilterValue(
                            value="sharepoint",
                            relation_type=models.RelationType.EQUALS,
                        ),
                    ],
                ),
                models.FacetFilter(
                    field_name="type",
                    values=[
                        models.FacetFilterValue(
                            value="document",
                            relation_type=models.RelationType.EQUALS,
                        ),
                    ],
                ),
            ],
        ),
    )
