def summarize_answer(state: InfoBotState):
    """the main agent responsible for taking all the context and answering the question"""
    logger.info("Generate final answer")

    llm = PROMPT_ANSWER | model

    response = llm.invoke(
        {
            "messages": state.messages,
            "glean_search_result_documents": state.glean_results,
            "answer_candidate": state.answer_candidate,
        }
    )
    state.messages.append(("agent", response.content))
    return state
