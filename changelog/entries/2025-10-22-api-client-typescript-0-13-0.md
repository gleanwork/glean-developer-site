---
title: "api-client-typescript v0.13.0"
categories: ["API Clients"]
tags: ["Feature"]
repo: "api-client-typescript"
version: "v0.13.0"
release_url: "https://github.com/gleanwork/api-client-typescript/releases/tag/v0.13.0"
date: "2025-10-22"
---
Adds support for the useImageGeneration flag in chat APIs across create retrieve and streaming endpoints. This enables applications to request or reflect image generation behavior within agentConfig for chat messages.

Highlights
- Support for agentConfig.useImageGeneration in chat create retrieve and createStream endpoints

Features
- glean.client.chat.create(): request.chatrequest.messages.[].agentConfig.useImageGeneration added; response.messages.[].agentConfig.useImageGeneration added
- glean.client.chat.retrieve(): response.chatresult.chat.messages.[].agentConfig.useImageGeneration added
- glean.client.chat.createStream(): request.chatrequest.messages.[].agentConfig.useImageGeneration added

Notes
- Release generated via Speakeasy CLI 1.638.0

Release: https://github.com/gleanwork/api-client-typescript/releases/tag/v0.13.0
