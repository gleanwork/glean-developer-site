import os
from glean.api_client import Glean, models

class CustomAgent:
    def __init__(self):
        self.api_token = os.getenv("GLEAN_API_TOKEN")
        self.server_url = os.getenv("GLEAN_SERVER_URL")
        
        if not self.api_token or not self.server_url:
            raise ValueError("GLEAN_API_TOKEN and GLEAN_SERVER_URL must be set")
    
    def search_documents(self, query: str, page_size: int = 5):
        """Search for relevant documents"""
        with Glean(api_token=self.api_token, server_url=self.server_url) as glean:
            try:
                response = glean.client.search.query(
                    query=query,
                    page_size=page_size
                )
                return response.results if hasattr(response, 'results') else []
            except Exception as e:
                print(f"Search error: {e}")
                return []
    
    def chat_with_context(self, query: str, search_results=None) -> str:
        """Generate response using chat API"""
        with Glean(api_token=self.api_token, server_url=self.server_url) as glean:
            try:
                # Prepare context from search results
                context = ""
                if search_results:
                    context = "\n".join([
                        f"- {result.get('title', '')}: {result.get('snippet', '')}"
                        for result in search_results[:3]
                    ])
                
                # Prepare the message with context
                message_text = query
                if context:
                    message_text = f"Context:\n{context}\n\nQuestion: {query}"
                
                response = glean.client.chat.create(
                    messages=[
                        {
                            "fragments": [
                                models.ChatMessageFragment(text=message_text)
                            ]
                        }
                    ]
                )
                
                # Extract response text
                if response.messages:
                    last_message = response.messages[-1]
                    if hasattr(last_message, 'fragments') and last_message.fragments:
                        for fragment in last_message.fragments:
                            if hasattr(fragment, 'text') and fragment.text:
                                return fragment.text
                
                return "No response received"
                
            except Exception as e:
                return f"Chat error: {e}"
    
    def process_query(self, query: str) -> dict:
        """Process a query by searching and then chatting"""
        # First search for relevant documents
        search_results = self.search_documents(query)
        
        # Then use chat to answer based on search results
        answer = self.chat_with_context(query, search_results)
        
        return {
            "answer": answer,
            "sources": search_results[:3],
            "total_sources": len(search_results)
        }

# Usage
agent = CustomAgent()
result = agent.process_query("What is our vacation policy?")
print(f"Answer: {result['answer']}")
print(f"Found {result['total_sources']} relevant documents")
