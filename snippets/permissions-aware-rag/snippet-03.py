prompt = f"""Answer using ONLY the numbered sources below. Cite inline like [1].
If the sources don't cover the question, say you don't have information on that.

Sources:
{numbered_sources}

Question: {question}"""

message = anthropic_client.messages.create(
    model="claude-sonnet-5",
    max_tokens=1024,
    messages=[{"role": "user", "content": prompt}],
)
