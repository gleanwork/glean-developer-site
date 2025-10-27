---
title: "api-client-python v0.11.0"
categories: ["API Clients"]
tags: ["Feature", "Documentation"]
repo: "api-client-python"
version: "v0.11.0"
release_url: "https://github.com/gleanwork/api-client-python/releases/tag/v0.11.0"
date: "2025-10-22"
---
Adds support for image generation configuration in chat endpoints across create, retrieve, and streaming calls. This enables agents to indicate and utilize image generation in message agent_config payloads and responses.

Highlights
- Add agent_config.use_image_generation to chat create and create_stream request/response messages
- Expose agent_config.use_image_generation in chat retrieve responses

Features
- chat.create: Added request.messages.[].agent_config.use_image_generation and response.messages.[].agent_config.use_image_generation.
- chat.retrieve: Added response.chat_result.chat.messages.[].agent_config.use_image_generation.
- chat.create_stream: Added request.messages.[].agent_config.use_image_generation.

Documentation
- Release notes generated via Speakeasy CLI 1.638.0.

Notes
- Corresponding PyPI version reference: glean 0.11.0.

Release: https://github.com/gleanwork/api-client-python/releases/tag/v0.11.0