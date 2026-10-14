#!/usr/bin/env npx tsx
/**
 * Local MCP server over the build output, for trying /mcp without Vercel.
 * Uses the same handler, local search index and skills as api/mcp.ts.
 *
 * Usage:
 *   1. Build the site: pnpm build
 *   2. Run: pnpm run mcp:local
 *
 * Then test with:
 *   curl http://localhost:3456/mcp
 *
 *   curl -X POST http://localhost:3456/mcp \
 *     -H "Content-Type: application/json" \
 *     -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
 *
 *   curl -X POST http://localhost:3456/mcp \
 *     -H "Content-Type: application/json" \
 *     -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"docs_search","arguments":{"query":"OAuth"}}}'
 */

import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { createNodeHandler } from 'docusaurus-plugin-mcp-server/adapters/node';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3456;

// GET returns the server's status, POST is MCP, as on the deployed /mcp.
const handler = createNodeHandler({
  artifactsDir: path.join(__dirname, '../build/mcp'),
  version: 'dev',
});

const server = http.createServer((req, res) => {
  if (req.url === '/mcp') {
    void handler(req, res);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found. Use GET or POST /mcp' }));
});

server.listen(PORT, () => {
  console.log(`
MCP server running at http://localhost:${PORT}/mcp

Test commands:
  curl http://localhost:${PORT}/mcp

  curl -X POST http://localhost:${PORT}/mcp \\
    -H "Content-Type: application/json" \\
    -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

  curl -X POST http://localhost:${PORT}/mcp \\
    -H "Content-Type: application/json" \\
    -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"docs_search","arguments":{"query":"OAuth"}}}'
`);
});
