---
title: Deprecate Previous Way of Processing Response Message Stream
categories: ["API"]
---

In the /chat API, the previous way of processing the response message stream has been deprecated as a result of the launch of LLM-generated citations.

{/* truncate */}

- LLM citations are interleaved within the response text fragments. Each fragment can have "text" or "citation".
- If streaming is set to False, the response may still be broken up into across multiple fragments.
- The citations interleaved inside the response do not have reference ranges (start and end indices) or snippets as they used to.
- For backwards compatibility, we still return a chat message with citations at the end in the old format, except there will be no startIndex and no snippets.

Visit the [Simple Chatbot Guide](../guides/chat/chatbot-example) for more information and an example. 