#!/usr/bin/env npx tsx
/**
 * Local MCP server for testing the Glean search provider integration.
 *
 * Usage:
 *   1. Create a .env file with GLEAN_API_TOKEN and GLEAN_INSTANCE
 *   2. Run: pnpm run mcp:local
 *
 * Then test with:
 *   curl http://localhost:3456/health
 *
 *   curl -X POST http://localhost:3456/mcp \
 *     -H "Content-Type: application/json" \
 *     -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
 *
 *   curl -X POST http://localhost:3456/mcp \
 *     -H "Content-Type: application/json" \
 *     -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"docs_search","arguments":{"query":"OAuth"}}}'
 */

import 'dotenv/config';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { McpDocsServer } from 'docusaurus-plugin-mcp-server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3456;

// Check for required environment variables
if (!process.env.GLEAN_API_TOKEN) {
  console.error('Error: GLEAN_API_TOKEN environment variable is required');
  process.exit(1);
}

if (!process.env.GLEAN_INSTANCE) {
  console.error('Error: GLEAN_INSTANCE environment variable is required');
  process.exit(1);
}

console.log('Initializing MCP server with Glean search provider...');

const mcpServer = new McpDocsServer({
  docsPath: path.join(__dirname, '../build/mcp/docs.json'),
  indexPath: path.join(__dirname, '../build/mcp/search-index.json'),
  name: 'glean-developer-docs',
  version: '1.0.0',
  baseUrl: 'https://developers.glean.com',
  // Use the Glean search provider
  search: path.join(__dirname, '../api/glean-search-provider.mjs'),
});

async function main() {
  await mcpServer.initialize();
  console.log('MCP server initialized with Glean search provider');

  const server = http.createServer(async (req, res) => {
    // Health check
    if (req.url === '/health' && req.method === 'GET') {
      const status = await mcpServer.getStatus();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(status, null, 2));
      return;
    }

    // MCP endpoint
    if (req.url === '/mcp' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => (body += chunk));
      req.on('end', async () => {
        try {
          const parsed = JSON.parse(body);
          await mcpServer.handleHttpRequest(req, res, parsed);
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: (err as Error).message }));
        }
      });
      return;
    }

    // 404 for other routes
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found. Use POST /mcp or GET /health' }));
  });

  server.listen(PORT, () => {
    console.log(`
MCP server running at http://localhost:${PORT}/mcp
Using Glean instance: ${process.env.GLEAN_INSTANCE}

Test commands:
  curl http://localhost:${PORT}/health

  curl -X POST http://localhost:${PORT}/mcp \\
    -H "Content-Type: application/json" \\
    -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

  curl -X POST http://localhost:${PORT}/mcp \\
    -H "Content-Type: application/json" \\
    -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"docs_search","arguments":{"query":"OAuth"}}}'
`);
  });
}

main().catch((error) => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});
