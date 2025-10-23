---
title: "[langchain-glean] v0.3.3"
categories: ["langchain-glean"]
tags: ["Bug Fix"]
repo: "langchain-glean"
version: "v0.3.3"
release_url: "https://github.com/gleanwork/langchain-glean/releases/tag/v0.3.3"
date: "2025-07-18"
---
This release includes fixes around environment and runtime propagation and keeps tests up to date with the latest SDK structure. Users relying on act_as or GLEAN_ACT_AS will see correct propagation during execution.

- Ensure act_as and GLEAN_ACT_AS are correctly propagated

Bug Fixes
- Ensure act_as and GLEAN_ACT_AS are propagated (#20)
- Update tests with new SDK import path (#17)

Notes
- Includes housekeeping for test imports aligned with the updated SDK path.

Release: https://github.com/gleanwork/langchain-glean/releases/tag/v0.3.3
