#!/usr/bin/env npx tsx
/**
 * Local MCP server over the build output, for trying /mcp without Vercel.
 * Uses the same local search index and skills as api/mcp.ts.
 *
 * Usage:
 *   1. Build the site: pnpm build
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

import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { McpDocsServer } from 'docusaurus-plugin-mcp-server';
import { readArtifactBundle } from 'docusaurus-plugin-mcp-server/adapters/node';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3456;

async function main() {
  const mcpServer = new McpDocsServer({
    artifacts: await readArtifactBundle(path.join(__dirname, '../build/mcp')),
    version: 'dev',
  });
  await mcpServer.initialize();

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
    res.end(
      JSON.stringify({ error: 'Not found. Use POST /mcp or GET /health' }),
    );
  });

  server.listen(PORT, () => {
    console.log(`
MCP server running at http://localhost:${PORT}/mcp

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
