from glean.agent_toolkit.tools import search, employee_search, calendar_search
from crewai import Agent, Task, Crew
import os

os.environ["GLEAN_API_TOKEN"] = "your-api-token"
os.environ["GLEAN_SERVER_URL"] = "https://your-company-be.glean.com"

# Create agents with different specializations
researcher = Agent(
    role='Research Specialist',
    goal='Find relevant company information and documents',
    backstory='Expert at searching and analyzing company knowledge',
    tools=[search.as_crewai_tool()]
)

hr_specialist = Agent(
    role='HR Specialist', 
    goal='Find employee information and schedule meetings',
    backstory='Expert at employee relations and scheduling',
    tools=[
        employee_search.as_crewai_tool(),
        calendar_search.as_crewai_tool()
    ]
)

# Define tasks
research_task = Task(
    description='Find information about our remote work policy',
    agent=researcher
)

scheduling_task = Task(
    description='Find the HR manager and check their availability this week',
    agent=hr_specialist
)

# Create and run the crew
crew = Crew(
    agents=[researcher, hr_specialist],
    tasks=[research_task, scheduling_task]
)

result = crew.kickoff()
