import requests
import os

api_token = os.getenv("GLEAN_API_TOKEN")
server_url = os.getenv("GLEAN_SERVER_URL")
base_url = f"{server_url}/rest/api/v1"

headers = {
    "Authorization": f"Bearer {api_token}",
    "Content-Type": "application/json"
}

response = requests.post(
    f"{base_url}/search",
    headers=headers,
    json={
        "query": "vacation policy",
        "pageSize": 10
    }
)
response.raise_for_status()

results = response.json().get("results", [])
for result in results:
    print(f"Title: {result.get('title', 'No title')}")
    print(f"URL: {result.get('url', 'No URL')}")
    snippets = result.get('snippets', [])
    if snippets:
        print(f"Snippet: {snippets[0].get('snippet', '')}")
