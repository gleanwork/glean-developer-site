curl -X POST https://customer-be.glean.com/api/index/v1/getdocumentcount
  -H 'Authorization : Bearer <token>'
  -H 'Content-Type : application/json' \
  -d '{
        "datasource": "gleantest"
      }'
