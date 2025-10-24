---
title: "langchain-glean v0.2.1"
categories: ["langchain-glean"]
tags: ["Feature","Bug Fix","Breaking","Documentation"]
repo: "langchain-glean"
version: "v0.2.1"
release_url: "https://github.com/gleanwork/langchain-glean/releases/tag/v0.2.1"
date: "2025-10-20"
---
Introduces a new GleanSearch tool with improved query expansion and automatic token refresh handling for 401 responses. Note the breaking rename of GleanRetriever to GleanDocumentsRetriever, which requires code updates. Documentation and examples have been refreshed.

- New GleanSearch tool with improved query expansion
- Automatic 401 token refresh handling
- BREAKING: GleanRetriever renamed to GleanDocumentsRetriever

Features
- Add GleanSearch tool with improved query expansion for better retrieval quality.

Bug Fixes
- Automatically handle 401 responses by refreshing the token.

Breaking Changes
- Rename GleanRetriever to GleanDocumentsRetriever; update imports/usages accordingly.

Documentation
- Update README with new examples covering GleanSearch and authentication behavior.

Dependencies
- Bump dependencies to latest compatible versions.

Release: https://github.com/gleanwork/langchain-glean/releases/tag/v0.2.1
