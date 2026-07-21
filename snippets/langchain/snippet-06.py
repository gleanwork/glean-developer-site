from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_openai_tools_agent
from langchain_glean.retrievers import GleanSearchRetriever
from langchain_glean.tools import GleanSearchTool

# Initialize the retriever
retriever = GleanSearchRetriever()

# Create the tool
glean_tool = GleanSearchTool(
    retriever=retriever,
    name="glean_search",
    description="Search for information in your organization's content using Glean."
)

# Create an agent with the tool
llm = ChatOpenAI(model="gpt-4o")
prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful assistant with access to Glean search."),
    ("user", "{input}")
])

agent = create_openai_tools_agent(llm, [glean_tool], prompt)
agent_executor = AgentExecutor(agent=agent, tools=[glean_tool])

# Run the agent
response = agent_executor.invoke({"input": "Find the latest quarterly report"})
print(response["output"])
