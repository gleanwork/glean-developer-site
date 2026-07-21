from glean.api_client.errors import GleanError
import time

def robust_agent_call(agent, query, max_retries=3):
    """Execute agent call with retry logic"""
    for attempt in range(max_retries):
        try:
            return agent.process_query(query)
        except GleanError as e:
            if hasattr(e, 'status_code') and e.status_code == 429:  # Rate limited
                wait_time = 2 ** attempt  # Exponential backoff
                print(f"Rate limited, waiting {wait_time} seconds...")
                time.sleep(wait_time)
            elif attempt == max_retries - 1:
                return {"answer": f"Error after {max_retries} attempts: {e}", "sources": [], "total_sources": 0}
            else:
                print(f"Attempt {attempt + 1} failed: {e}")
        except Exception as e:
            if attempt == max_retries - 1:
                return {"answer": f"Unexpected error: {e}", "sources": [], "total_sources": 0}
    
    return {"answer": "Failed to get response", "sources": [], "total_sources": 0}
