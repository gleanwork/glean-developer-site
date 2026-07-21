import logging
from glean.api_client import Glean, models
from glean.api_client.errors import GleanError

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def send_chat_message_with_retry(message_text, max_retries=3):
    """Send chat message with retry logic."""
    api_token = os.getenv("GLEAN_API_TOKEN")
    server_url = os.getenv("GLEAN_SERVER_URL")
    
    if not api_token:
        return "Missing GLEAN_API_TOKEN"
    if not server_url:
        return "Missing GLEAN_SERVER_URL"
    
    for attempt in range(max_retries):
        try:
            with Glean(api_token=api_token, server_url=server_url) as glean:
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
                
        except GleanError as e:
            logger.warning(f"Glean API error on attempt {attempt + 1}: {e}")
            if attempt == max_retries - 1:
                return f"Failed after {max_retries} attempts: {e}"
        
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            return f"Unexpected error: {e}"
    
    return "Failed to get response"
