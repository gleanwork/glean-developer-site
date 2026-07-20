---
title: 'glean-agent-toolkit 0.6.1'
categories: ['Glean Agent Toolkit']
---

Glean-agent-toolkit 0.6.1: **read_document**: support renamed retrieve kwarg across glean-api-client versions.

{/* truncate */}

## Changes

- **read_document**: support renamed retrieve kwarg across glean-api-client versions.
- **crewai**: pass args_schema to BaseTool so the LLM sees real parameters.
- **adk**: expose real typed signatures so declarations and invocation work.
- **openai**: sanitize strict schemas and isolate per-tool conversion failures.
- **adapters**: map anyOf/union and array item types correctly in get_field_type.
- **langchain**: use StructuredTool so converted tools are invocable.
- **tools**: stop closing shared Glean client on every tool call.

## Source

- [Release notes](https://github.com/gleanwork/glean-agent-toolkit/releases/tag/0.6.1)
- [PR #81](https://github.com/gleanwork/glean-agent-toolkit/pull/81)
- [PR #73](https://github.com/gleanwork/glean-agent-toolkit/pull/73)
- [PR #77](https://github.com/gleanwork/glean-agent-toolkit/pull/77)
- [PR #76](https://github.com/gleanwork/glean-agent-toolkit/pull/76)
- [PR #75](https://github.com/gleanwork/glean-agent-toolkit/pull/75)
- [PR #74](https://github.com/gleanwork/glean-agent-toolkit/pull/74)
- [PR #72](https://github.com/gleanwork/glean-agent-toolkit/pull/72)
