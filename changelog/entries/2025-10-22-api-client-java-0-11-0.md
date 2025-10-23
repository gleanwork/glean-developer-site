---
title: "[api-client-java] v0.11.0"
categories: ["API Clients"]
tags: ["Feature", "Documentation"]
repo: "api-client-java"
version: "v0.11.0"
release_url: "https://github.com/gleanwork/api-client-java/releases/tag/v0.11.0"
date: "2025-10-22"
---
Adds useImageGeneration flags to chat APIs in the Java client, enabling callers to request or detect image generation behavior per message. This expands multimodal capabilities across create, retrieve, and streaming chat endpoints.

- Added agentConfig.useImageGeneration to chat.create and chat.createStream requests and responses.
- Added agentConfig.useImageGeneration to chat.retrieve responses.

Features
- chat.create: request.messages[].agentConfig.useImageGeneration added.
- chat.create: response.messages[].agentConfig.useImageGeneration added.
- chat.retrieve: response.chat.messages[].agentConfig.useImageGeneration added.
- chat.createStream: request.messages[].agentConfig.useImageGeneration added.

Documentation
- Release generated via Speakeasy CLI 1.638.0 with published artifact com.glean.api-client:glean-api-client:0.11.0.

Release: https://github.com/gleanwork/api-client-java/releases/tag/v0.11.0
