from glean.agent_toolkit.tools import search, employee_search
from glean.agent_toolkit import tool_spec

@tool_spec(
    name="research_and_contact",
    description="Research a topic and find relevant experts to contact"
)
def research_and_contact(topic: str) -> dict:
    """Research a topic and find experts."""

    # Calling a tool directly returns a ToolResult envelope:
    # {"status": "ok" | "error", "result": <payload>, "error": ..., ...}
    search_response = search(query=topic)
    search_results = search_response["result"] if search_response["status"] == "ok" else []

    # Extract mentioned people from results
    mentioned_people = extract_people_from_results(search_results)

    # Find employee details
    experts = []
    for person_name in mentioned_people:
        employee_response = employee_search(query=person_name)
        if employee_response["status"] == "ok" and employee_response["result"]:
            experts.append(employee_response["result"])

    return {
        "research_results": search_results,
        "experts": experts,
        "summary": f"Found {len(search_results)} documents and {len(experts)} experts on {topic}"
    }

def extract_people_from_results(results):
    """Extract people mentioned in search results."""
    # Implementation to parse names from document content
    pass
