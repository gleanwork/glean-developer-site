from glean.agent_toolkit.tools import search
from glean.agent_toolkit import tool_spec
import time

# Built-in tools return a ToolResult envelope and never raise on API errors;
# inspect result["status"] and retry on transient error types.
RETRYABLE = {"timeout", "rate_limit", "api"}

@tool_spec(
    name="robust_search",
    description="Search with automatic retries and error handling"
)
def robust_search(query: str, max_retries: int = 3) -> dict:
    """Search with retry logic."""

    for attempt in range(max_retries):
        result = search(query=query)
        if result["status"] == "ok":
            return result
        if result["error_type"] in RETRYABLE and attempt < max_retries - 1:
            time.sleep(2 ** attempt)  # Exponential backoff
            continue
        return result
