---
name: docs-research
description: "Answer questions about building on Glean from the Glean developer documentation (developers.glean.com): the Client, Indexing and Platform APIs, authentication, the API clients and SDKs, agents, tools, and the remote MCP server. Use when the user is writing code or configuration against Glean's developer APIs and wants answers backed by links to the docs."
---

# Researching the Glean developer documentation

This MCP server exposes the Glean developer documentation (developers.glean.com) through two tools:

- `docs_search`: full-text search across every page. Returns titles, URLs, matching sections, and snippets.
- `docs_fetch`: returns the complete markdown of one page, given its URL.

## Workflow

1. **Search first.** Call `docs_search` with a few specific keywords (API or endpoint names, SDK names, error codes) rather than a full sentence. For example, search `bulk index documents`, not "how do I upload a lot of documents?".
2. **Pick candidates.** Use titles, matching sections, and snippets to choose the one to three most relevant URLs. Snippets are excerpts, not answers.
3. **Fetch before answering.** Call `docs_fetch` with an exact URL from the results. The page starts with a contents list; focus on the sections that matter.
4. **Refine when results are thin.** Search again with synonyms, narrower terms, or terms you saw in fetched pages. Try two or three searches before concluding the docs don't cover something.
5. **Answer from the docs.** Ground the answer in fetched content and link the pages you used (add `#heading-id` anchors where useful). If the docs don't cover the question, say so instead of guessing.

## Where things are

- **Endpoint reference** lives under `/api/client-api/`, `/api/indexing-api/` and `/api/platform-api/`. Each endpoint has its own page, titled by the operation (for example "Create an agent" or "Bulk index documents"). Include the API name in the search when the same operation exists in more than one API.
- **Site-wide basics** are under `/get-started/`: the authentication overview (which API uses which token), key terms, and rate limits.
- **Authentication and getting started** for the Client and Indexing APIs are under `/api-info/`. For the Platform API they are under `/api/platform-api/`. Search `authentication` with the API name.
- **API clients and SDKs** are under `/libraries/`: the Python, TypeScript, Go and Java API clients, the Indexing SDK, and the Web SDK.
- **Guides** (search, chat, agents, tools, triggers, MCP hosts) are under `/guides/`, and end-to-end examples are under `/cookbook/`.
- **Error codes** such as `rate_limit_exceeded` each have a page under `/errors/`. Search the code or the HTTP status with a keyword, like `429 rate limit`.

## Tips

- `docs_search` returns up to 16 results by default (max 20). Pass a smaller `limit` for focused lookups.
- Only pass URLs to `docs_fetch` that came from `docs_search` results or from links in fetched pages.
- Prefer several targeted searches over one broad one; each search is cheap.
