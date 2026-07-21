curl -X POST https://your-instance-be.glean.com/rest/api/v1/agents/runs/wait \
  -H 'Authorization: Bearer <your_token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "agent_id": "your-agent-id",
    "input": {
      "query": "Analyze our Q4 sales performance",
      "region": "North America",
      "timeframe": "Q4 2023"
    }
  }'
