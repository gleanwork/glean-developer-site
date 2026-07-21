import os
from glean.api_client import Glean, models

def stream_chat_response(message_text):
    """Stream chat response in real-time."""
    api_token = os.getenv("GLEAN_API_TOKEN")
    server_url = os.getenv("GLEAN_SERVER_URL")
    
    if not api_token:
        print("Error: GLEAN_API_TOKEN environment variable required")
        return
    if not server_url:
        print("Error: GLEAN_SERVER_URL environment variable required")
        return
    
    with Glean(api_token=api_token, server_url=server_url) as glean:
        try:
            response_stream = glean.client.chat.create_stream(
                messages=[
                    {
                        "fragments": [
                            models.ChatMessageFragment(
                                text=message_text,
                            ),
                        ],
                    },
                ],
            )
            
            print("Bot: ", end="", flush=True)
            
            for chunk in response_stream:
                if chunk:
                    print(chunk, end="", flush=True)
            print()
            
        except Exception as e:
            print(f"Error during streaming: {e}")

def main():
    """Interactive streaming chatbot."""
    print("Glean Streaming Chatbot - Type 'quit' to exit")
    print("-" * 45)
    
    while True:
        user_input = input("\nYou: ").strip()
        
        if user_input.lower() in ['quit', 'exit', 'q']:
            print("Goodbye!")
            break
        
        if user_input:
            stream_chat_response(user_input)

if __name__ == "__main__":
    main()
