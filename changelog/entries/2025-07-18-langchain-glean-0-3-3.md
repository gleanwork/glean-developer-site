---
title: "langchain-glean v0.3.3"
categories: ["langchain-glean"]
tags: ["Bug Fix"]
repo: "langchain-glean"
version: "v0.3.3"
release_url: "https://github.com/gleanwork/langchain-glean/releases/tag/v0.3.3"
date: "2025-07-18"
---
This release includes fixes to ensure impersonation settings are consistently propagated and updates tests for the new SDK import path. These changes improve reliability when using act_as/GLEAN_ACT_AS and keep the test suite aligned with recent SDK structure.

Highlights
- Ensure act_as and GLEAN_ACT_AS are propagated
- Update tests to reflect new SDK import path

Bug Fixes
- Ensure act_as and GLEAN_ACT_AS environment settings are propagated correctly (#20).

Documentation
- Update tests with the new SDK import path to align with recent SDK changes (#17).

Notes
- Tag v0.3.3 published on 2025-07-18.

Release: https://github.com/gleanwork/langchain-glean/releases/tag/v0.3.3
