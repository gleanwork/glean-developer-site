curl -i -X POST \
  'https://customer-be.glean.com/rest/api/v1/activity' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -H 'X-Glean-ActAs: user-whose-activity-is-being-reported@example.com' \
  -d '{
    "events": [
      {
        "url": "https://example.com/doc1",
        "action": "VIEW",
        "timestamp": "2023-04-05T04:56:07.000Z",
        "params": {
            "datasource": "testdatasource"
        }
      },
      {
        "url": "https://example.com/doc2",
        "action": "VIEW",
        "timestamp": "2023-04-04T04:56:07.000Z",
        "params": {
          "duration": 20,
          "referrer": "https://example.com/document",
          "datasource": "testdatasource2"
        }
      }
    ]
  }'
