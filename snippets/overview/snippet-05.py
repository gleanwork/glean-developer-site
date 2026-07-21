from glean.api_client import Glean, models

with Glean(api_token=api_token, server_url=server_url) as glean:
    response = glean.client.search.query(query="benefits")

    # Each response and each result carries a trackingToken; report result
    # events back via /feedback to improve ranking quality.
    clicked_result = response.results[0]
    glean.client.activity.feedback(feedback1={
        "tracking_tokens": [clicked_result.tracking_token],
        "event": models.FeedbackEvent.CLICK,
    })
