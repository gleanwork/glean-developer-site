import os
from glean.api_client import Glean, models
from typing import List, Dict, Optional

class AdvancedAgent:
    def __init__(self):
        self.api_token = os.getenv("GLEAN_API_TOKEN")
        self.server_url = os.getenv("GLEAN_SERVER_URL")
        self.conversation_history = []
        
        if not self.api_token or not self.server_url:
            raise ValueError("GLEAN_API_TOKEN and GLEAN_SERVER_URL must be set")
    
    def search_with_filters(self, query: str, filters: Optional[Dict] = None, page_size: int = 10) -> List[Dict]:
        """Search with optional filters"""
        with Glean(api_token=self.api_token, server_url=self.server_url) as glean:
            try:
                search_params = {
                    "query": query,
                    "page_size": page_size
                }
                
                if filters:
                    search_params["request_options"] = {"facet_filters": filters}
                
                response = glean.client.search.query(**search_params)
                return response.results if hasattr(response, 'results') else []
                
            except Exception as e:
                print(f"Search error: {e}")
                return []
    
    def chat_with_context(self, query: str, context_docs: Optional[List[Dict]] = None, save_to_history: bool = True) -> str:
        """Chat with document context and conversation history"""
        with Glean(api_token=self.api_token, server_url=self.server_url) as glean:
            try:
                # Build message with context
                message_parts = []
                
                if context_docs:
                    context_text = "\n".join([
                        f"- {doc.get('title', 'Unknown')}: {doc.get('snippet', '')}"
                        for doc in context_docs[:3]
                        if doc.get('snippet')
                    ])
                    if context_text:
                        message_parts.append(f"Relevant context:\n{context_text}")
                
                message_parts.append(f"Question: {query}")
                full_message = "\n\n".join(message_parts)
                
                # Include conversation history if available
                messages = []
                for hist_msg in self.conversation_history[-4:]:  # Last 4 messages for context
                    messages.append(hist_msg)
                
                # Add current message
                current_message = {
                    "fragments": [models.ChatMessageFragment(text=full_message)]
                }
                messages.append(current_message)
                
                response = glean.client.chat.create(messages=messages)
                
                # Extract response
                answer = "No response received"
                if response.messages:
                    last_message = response.messages[-1]
                    if hasattr(last_message, 'fragments') and last_message.fragments:
                        for fragment in last_message.fragments:
                            if hasattr(fragment, 'text') and fragment.text:
                                answer = fragment.text
                                break
                
                # Save to conversation history
                if save_to_history:
                    self.conversation_history.append(current_message)
                    self.conversation_history.append({
                        "fragments": [models.ChatMessageFragment(text=answer)]
                    })
                    
                    # Keep only last 10 messages
                    if len(self.conversation_history) > 10:
                        self.conversation_history = self.conversation_history[-10:]
                
                return answer
                
            except Exception as e:
                return f"Chat error: {e}"
    
    def summarize_documents(self, documents: List[Dict]) -> str:
        """Summarize a list of documents"""
        with Glean(api_token=self.api_token, server_url=self.server_url) as glean:
            try:
                document_specs = [
                    {"url": doc["url"]}
                    for doc in documents[:5]  # Limit to 5 docs
                    if doc.get("url")
                ]

                if not document_specs:
                    return "No documents to summarize"

                response = glean.client.documents.summarize(
                    document_specs=document_specs,
                    preferred_summary_length=500,
                )

                if response.summary and response.summary.text:
                    return response.summary.text
                return "Could not generate summary"
                
            except Exception as e:
                return f"Summarization error: {e}"
    
    def process_complex_query(self, query: str, department: Optional[str] = None, include_summary: bool = False) -> Dict:
        """Process query with department filtering and optional summarization"""
        filters = {}
        if department:
            filters["department"] = [department]
        
        # Search for documents
        search_results = self.search_with_filters(query, filters)
        
        # Generate answer with context
        answer = self.chat_with_context(query, search_results)
        
        result = {
            "answer": answer,
            "sources": search_results[:5],
            "total_sources": len(search_results),
            "department_filter": department
        }
        
        # Add summary if requested
        if include_summary and search_results:
            result["summary"] = self.summarize_documents(search_results)
        
        return result
    
    def reset_conversation(self):
        """Clear conversation history"""
        self.conversation_history = []

# Usage
agent = AdvancedAgent()

# Basic query
result = agent.process_complex_query(
    "What are the remote work guidelines?", 
    department="HR",
    include_summary=True
)

print(f"Answer: {result['answer']}")
print(f"Summary: {result.get('summary', 'No summary available')}")
print(f"Found {result['total_sources']} sources")

# Follow-up question (uses conversation history)
followup = agent.process_complex_query("Are there any exceptions to these guidelines?")
print(f"Follow-up answer: {followup['answer']}")
