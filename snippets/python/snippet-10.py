from django.http import JsonResponse
from glean.api_client import Glean
import json

def chat_view(request):
    data = json.loads(request.body)
    message = data.get('message')
    
    with Glean(
        api_token=os.getenv("GLEAN_API_TOKEN"),
        server_url=os.getenv("GLEAN_SERVER_URL"),
    ) as client:
        response = client.client.chat.create(
            messages=[{"fragments": [{"text": message}]}]
        )
        
    return JsonResponse({'response': str(response)})
