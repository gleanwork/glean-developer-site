---
title: "api-client-python v0.11.0"
categories: ["API Clients"]
tags: ["Feature", "Documentation"]
repo: "api-client-python"
version: "v0.11.0"
release_url: "https://github.com/gleanwork/api-client-python/releases/tag/v0.11.0"
date: "2025-10-22"
---
Introduces support for image generation toggles in chat APIs across create, retrieve, and streaming endpoints. This enables clients to control and observe agent image generation behavior via agent_config.use_image_generation.

Highlights
- Add agent_config.use_image_generation to chat create and create_stream requests and responses
- Expose agent_config.use_image_generation in chat retrieve response

Features
- chat.create: Added request.messages.[].agent_config.use_image_generation and response.messages.[].agent_config.use_image_generation
- chat.retrieve: Added response.chat_result.chat.messages.[].agent_config.use_image_generation
- chat.create_stream: Added request.messages.[].agent_config.use_image_generation

Documentation
- Release notes generated via Speakeasy CLI 1.638.0 referencing glean 0.11.0 on PyPI

Notes
- No breaking changes indicated

Release: https://github.com/gleanwork/api-client-python/releases/tag/v0.11.0
