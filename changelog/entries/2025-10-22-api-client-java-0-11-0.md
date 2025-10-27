---
title: "api-client-java v0.11.0"
categories: ["API Clients"]
tags: ["Feature", "Documentation"]
repo: "api-client-java"
version: "v0.11.0"
release_url: "https://github.com/gleanwork/api-client-java/releases/tag/v0.11.0"
date: "2025-10-22"
---
Adds support for controlling image generation in agent configuration across chat APIs. Developers can now set and receive the useImageGeneration flag in create, retrieve, and streaming chat endpoints.

Highlights
- New agentConfig.useImageGeneration flag supported in chat create, retrieve, and createStream endpoints

Features
- chat.create: request.messages[].agentConfig.useImageGeneration added
- chat.create: response.messages[].agentConfig.useImageGeneration added
- chat.retrieve: response.chatResult.chat.messages[].agentConfig.useImageGeneration added
- chat.createStream: request.messages[].agentConfig.useImageGeneration added

Documentation
- Release notes generated via Speakeasy CLI 1.638.0 with artifact publication to Maven Central

Release: https://github.com/gleanwork/api-client-java/releases/tag/v0.11.0