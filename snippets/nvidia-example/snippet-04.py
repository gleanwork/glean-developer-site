class InfoBotState(BaseModel):
    messages: List[Tuple[str, str]] = None
    glean_query_required: Optional[bool] = None
    glean_results: Optional[List[str]] = None
    db: Optional[Any] = None
    answer_candidate: Optional[str] = None

graph = StateGraph(InfoBotState)
graph.add_node("determine_user_intent", determine_user_intent)
graph.add_node("call_glean", call_glean)
graph.add_node("add_embeddings", add_embeddings)
graph.add_node("answer_candidates", answer_candidates)
graph.add_node("summarize_answer", summarize_answer)
graph.add_edge(START, "determine_user_intent")
graph.add_conditional_edges(
    "determine_user_intent",
    route_glean,
    {"call_glean": "call_glean", "summarize_answer": "summarize_answer"}
)
graph.add_edge("call_glean", "add_embeddings")
graph.add_edge("add_embeddings", "answer_candidates")
graph.add_edge("answer_candidates", "summarize_answer")
graph.add_edge("summarize_answer", END)
agent = graph.compile()
