import os
from glean.api_client import Glean, models

def send_chat_message(message_text):
    """Send a message to Glean Chat and get the response."""
    api_token = os.getenv("GLEAN_API_TOKEN")
    server_url = os.getenv("GLEAN_SERVER_URL")
    
    if not api_token:
        raise ValueError("GLEAN_API_TOKEN environment variable is required")
    if not server_url:
        raise ValueError("GLEAN_SERVER_URL environment variable is required")
    
    with Glean(api_token=api_token, server_url=server_url) as glean:
        try:
            response = glean.client.chat.create(
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
            
            if response.messages:
                last_message = response.messages[-1]
                if hasattr(last_message, 'fragments') and last_message.fragments:
                    for fragment in last_message.fragments:
                        if hasattr(fragment, 'text') and fragment.text:
                            return fragment.text
            
            return "No response received"
            
        except Exception as e:
            return f"Error: {str(e)}"

def main():
    """Simple interactive chatbot."""
    print("Glean Chatbot - Type 'quit' to exit")
    print("-" * 40)
    
    while True:
        user_input = input("\nYou: ").strip()
        
        if user_input.lower() in ['quit', 'exit', 'q']:
            print("Goodbye!")
            break
        
        if not user_input:
            continue
        
        print("Bot: ", end="", flush=True)
        try:
            response = send_chat_message(user_input)
            print(response)
        except ValueError as e:
            print(f"Setup error: {e}")
            break

if __name__ == "__main__":
    main()
