curl -X POST https://customer-be.glean.com/api/index/v1/betausers \
-H 'Authorization: Bearer <token>' \
-H 'Content-Type : application/json' \
-d '
{
    "datasource": "gleantest",
    "emails": [
        "user1@example.com",
        "user2@example.com"
    ]
}'
