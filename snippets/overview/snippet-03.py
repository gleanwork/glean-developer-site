from datetime import datetime, timedelta
from glean.api_client import Glean, models

last_month = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")

with Glean(api_token=api_token, server_url=server_url) as glean:
    response = glean.client.search.query(
        query="product updates",
        request_options=models.SearchRequestOptions(
            facet_bucket_size=10,
            facet_filters=[
                models.FacetFilter(
                    field_name="last_updated_at",
                    values=[
                        models.FacetFilterValue(
                            value=last_month,
                            relation_type=models.RelationType.GT,
                        ),
                    ],
                ),
            ],
        ),
    )
