from glean_example.src.agent import agent

msg = "What's the latest on the new API project?"
history = []
history.append(("user", msg))
response = agent.invoke({"messages": history})
print(response["messages"][-1][1])
