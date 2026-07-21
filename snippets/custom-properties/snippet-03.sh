curl -X POST https://customer-be.glean.com/api/index/v1/indexdocument \
-H 'Authorization : Bearer <token>' \
-H 'Content-Type : application/json' \
-d '
{
   "document": {
        "title": "Account 1",
        "id": "Account_1",
        "customProperties": [
            {
                "name": "priority",
                "value": "High"
            }
        ]
   }
}'
