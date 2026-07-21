curl -X POST https://customer-be.glean.com/api/index/v1/adddatasource  \
-H 'Authorization : Bearer <token>' \
-H 'Content-Type : application/json' \
-d '
{
   "name": "testDatasource",
   "objectDefinitions": [
        {
            "name": "Account",
            "displayLabel": "Account",
            "propertyDefinitions": [
                {
                "name": "priority",
                "displayLabel": "Priority",
                "displayLabelPlural": "Priorities",
                "propertyType": "TEXT",
                "hideUiFacet": false
                }
            ]
        }
   ]
}'
