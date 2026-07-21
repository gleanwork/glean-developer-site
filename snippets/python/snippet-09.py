from fastapi import FastAPI
from glean.api_client import Glean
from pydantic import BaseModel

app = FastAPI()

class ChatRequest(BaseModel):
    message: str

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    with Glean(
        api_token=os.getenv("GLEAN_API_TOKEN"),
        server_url=os.getenv("GLEAN_SERVER_URL"),
    ) as client:
        response = client.client.chat.create(
            messages=[{"fragments": [{"text": request.message}]}]
        )
        return {"response": str(response)}
