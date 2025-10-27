---
title: "api-client-java v0.11.0"
categories: ["API Clients"]
tags: ["Feature", "Documentation"]
repo: "api-client-java"
version: "v0.11.0"
release_url: "https://github.com/gleanwork/api-client-java/releases/tag/v0.11.0"
date: "2025-10-22"
---
Introduces support for image generation configuration in chat APIs. Developers can now set and receive agentConfig.useImageGeneration on chat messages across create retrieve and streaming endpoints.

Highlights
- Add agentConfig.useImageGeneration to chat message requests and responses

Features
- chat.create: request.messages[].agentConfig.useImageGeneration added
- chat.create: response.messages[].agentConfig.useImageGeneration added
- chat.retrieve: response.chatResult.chat.messages[].agentConfig.useImageGeneration added
- chat.createStream: request.messages[].agentConfig.useImageGeneration added

Documentation
- Release notes generated via Speakeasy CLI 1.638.0

Release: https://github.com/gleanwork/api-client-java/releases/tag/v0.11.0
