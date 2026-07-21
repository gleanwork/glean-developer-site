import os
from glean.api_client import Glean, models

class ConversationalChatbot:
    def __init__(self):
        self.chat_id = None
        self.api_token = os.getenv("GLEAN_API_TOKEN")
        self.server_url = os.getenv("GLEAN_SERVER_URL")
        
        if not self.api_token:
            raise ValueError("GLEAN_API_TOKEN environment variable is required")
        if not self.server_url:
            raise ValueError("GLEAN_SERVER_URL environment variable is required")
    
    def send_message(self, user_message):
        """Send a message with conversation history."""
        with Glean(api_token=self.api_token, server_url=self.server_url) as glean:
            try:
                response = glean.client.chat.create(
                    messages=[
                        {
                            "fragments": [
                                models.ChatMessageFragment(
                                    text=user_message,
                                ),
                            ],
                        },
                    ],
                    chat_id=self.chat_id,
                    save_chat=True,
                )
                
                if hasattr(response, 'chat_id') and response.chat_id:
                    self.chat_id = response.chat_id
                
                if response.messages:
                    last_message = response.messages[-1]
                    if hasattr(last_message, 'fragments') and last_message.fragments:
                        for fragment in last_message.fragments:
                            if hasattr(fragment, 'text') and fragment.text:
                                return fragment.text
                
                return "No response received"
                
            except Exception as e:
                return f"Error: {str(e)}"
    
    def reset_conversation(self):
        """Start a new conversation."""
        self.chat_id = None

def main():
    """Conversational chatbot with memory."""
    print("Glean Conversational Chatbot")
    print("Type 'quit' to exit, 'reset' to start new conversation")
    print("-" * 55)
    
    try:
        chatbot = ConversationalChatbot()
    except ValueError as e:
        print(f"Setup error: {e}")
        return
    
    while True:
        user_input = input("\nYou: ").strip()
        
        if user_input.lower() in ['quit', 'exit', 'q']:
            print("Goodbye!")
            break
        elif user_input.lower() == 'reset':
            chatbot.reset_conversation()
            print("Started new conversation!")
            continue
        elif not user_input:
            continue
        
        print("Bot: ", end="", flush=True)
        response = chatbot.send_message(user_input)
        print(response)

if __name__ == "__main__":
    main()
