---
title: "api-client-java v0.11.0"
categories: ["API Clients"]
tags: ["Feature", "Documentation"]
repo: "api-client-java"
version: "v0.11.0"
release_url: "https://github.com/gleanwork/api-client-java/releases/tag/v0.11.0"
date: "2025-10-22"
---
Java API client v0.11.0 adds support for configuring image generation in chat agent messages across create, retrieve, and streaming endpoints. This enables applications to toggle or detect image generation behavior per message via agentConfig.useImageGeneration.

Highlights
- Add agentConfig.useImageGeneration to chat message request and response models for create, retrieve, and stream APIs.

Features
- Chat Create: Added request.chatrequest.messages.[].agentConfig.useImageGeneration and response.messages.[].agentConfig.useImageGeneration.
- Chat Retrieve: Added response.chatresult.chat.messages.[].agentConfig.useImageGeneration.
- Chat Create Stream: Added request.chatrequest.messages.[].agentConfig.useImageGeneration.

Documentation
- Release notes generated via Speakeasy CLI 1.638.0.

Notes
- Published artifact: com.glean.api-client:glean-api-client:0.11.0.

Release: https://github.com/gleanwork/api-client-java/releases/tag/v0.11.0
