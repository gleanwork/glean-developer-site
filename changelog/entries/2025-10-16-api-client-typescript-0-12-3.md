---
title: 'api-client-typescript v0.12.3'
categories: ['API Clients']
---

Breaking change: The retrieve() method in glean.client.messages now requires a request.datasource parameter, which may affect existing integrations. - The request.datasource parameter is now mandatory for glean.client.messages.retrieve(). - Existing code using this method without the new parameter...

{/* truncate */}

Full release notes: https://github.com/gleanwork/api-client-typescript/releases/tag/v0.12.3
