curl -X POST https://customer-be.glean.com/api/index/v1/debug/gleantest/user
  -H 'Authorization : Bearer <token>' \
  -H 'Content-Type : application/json' \
  -d '{
        "email": "user1@example.com"
      }'
