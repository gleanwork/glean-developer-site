---
title: 'glean-agent-toolkit 0.6.0'
categories: ['Glean Agent Toolkit']
---

Glean-agent-toolkit 0.6.0: **crewai**: pass args_schema to BaseTool so the LLM sees real parameters.

{/* truncate */}

## Action Required

- Plan migration away from deprecated behavior.

## Changes

- Add installable skills for SDK usage and tool building.
- Search API alignment, chat tool, deprecation path, get_tools, async support, import docs.
- Injectable GleanContext replaces hidden api_client() global (#62).
- **deps**: add [all] extra combining all framework adapters (CHK-001).
- **crewai**: pass args_schema to BaseTool so the LLM sees real parameters.
- **adk**: expose real typed signatures so declarations and invocation work.
- **openai**: sanitize strict schemas and isolate per-tool conversion failures.
- **adapters**: map anyOf/union and array item types correctly in get_field_type.
- **langchain**: use StructuredTool so converted tools are invocable.
- **tools**: stop closing shared Glean client on every tool call.
- Correct web search tool name from 'Web Browser' to 'Gemini Web Search'.
- Resolve remaining P2 eval items (CHK-111, CHK-115, CHK-118, CHK-119).
- Resolve eval checklist items — dedup, dead code, error handling, imports.
- Namespace tool names and optimize descriptions for LLM consumption.
- Structured error results and consistent adapter return types.
- Depend on langchain-core instead of langchain to support LangGraph 1.x.
- Regenerate lockfile.
- Align publish workflow tag trigger with commitizen tag format.
- Use is not None checks in read_document validation.
- Export Registry from top-level package.
- Remove pydantic BaseModel from adapters public API.
- Preserve float values in retry backoff config (CHK-002).
- **release**: correct broken version_files path in .cz.toml (CHK-006).

## Source

- [Release notes](https://github.com/gleanwork/glean-agent-toolkit/releases/tag/0.6.0)
- [PR #73](https://github.com/gleanwork/glean-agent-toolkit/pull/73)
- [PR #77](https://github.com/gleanwork/glean-agent-toolkit/pull/77)
- [PR #76](https://github.com/gleanwork/glean-agent-toolkit/pull/76)
- [PR #75](https://github.com/gleanwork/glean-agent-toolkit/pull/75)
- [PR #74](https://github.com/gleanwork/glean-agent-toolkit/pull/74)
- [PR #72](https://github.com/gleanwork/glean-agent-toolkit/pull/72)
- [PR #70](https://github.com/gleanwork/glean-agent-toolkit/pull/70)
- [PR #66](https://github.com/gleanwork/glean-agent-toolkit/pull/66)
- [PR #65](https://github.com/gleanwork/glean-agent-toolkit/pull/65)
- [PR #27](https://github.com/gleanwork/glean-agent-toolkit/pull/27)
- [PR #71](https://github.com/gleanwork/glean-agent-toolkit/pull/71)
- [PR #68](https://github.com/gleanwork/glean-agent-toolkit/pull/68)
- [PR #67](https://github.com/gleanwork/glean-agent-toolkit/pull/67)
- [PR #58](https://github.com/gleanwork/glean-agent-toolkit/pull/58)
- [PR #55](https://github.com/gleanwork/glean-agent-toolkit/pull/55)
- [PR #54](https://github.com/gleanwork/glean-agent-toolkit/pull/54)
- [PR #39](https://github.com/gleanwork/glean-agent-toolkit/pull/39)
- [PR #37](https://github.com/gleanwork/glean-agent-toolkit/pull/37)
- [PR #36](https://github.com/gleanwork/glean-agent-toolkit/pull/36)
- [PR #35](https://github.com/gleanwork/glean-agent-toolkit/pull/35)
- [PR #31](https://github.com/gleanwork/glean-agent-toolkit/pull/31)
