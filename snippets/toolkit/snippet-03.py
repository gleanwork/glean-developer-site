from glean.agent_toolkit.tools import search, employee_search
import os

# Ensure environment variables are set
os.environ["GLEAN_API_TOKEN"] = "your-api-token"
os.environ["GLEAN_SERVER_URL"] = "https://your-company-be.glean.com"

# Use with LangChain
langchain_search = search.as_langchain_tool()
langchain_employees = employee_search.as_langchain_tool()

# Use with CrewAI
crewai_search = search.as_crewai_tool()
crewai_employees = employee_search.as_crewai_tool()

# Use with OpenAI Agents SDK
openai_search = search.as_openai_tool()
openai_employees = employee_search.as_openai_tool()
