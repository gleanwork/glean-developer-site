/**
 * Vercel API route for MCP server
 * Deploy to Vercel and this will be available at /api/mcp
 * With the rewrite in vercel.json, also available at /mcp
 *
 * Serves the artifact bundle the build writes (build/mcp/bundle.json): the
 * docs, the local search index, and the site's docs-research skill
 * (mcp-skills/). Search runs in process, so it needs no credentials and makes
 * no outbound calls.
 *
 * The server name and base URL come from the bundle, which the build writes
 * from the plugin options and site URL in docusaurus.config.ts. The version is
 * the commit of the deploy serving the request, so a bad answer can be traced
 * to it.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { McpDocsServer } from 'docusaurus-plugin-mcp-server';
import path from 'path';

// Initialize the server (lazy-loaded on first request)
let server: McpDocsServer | null = null;
let initialized = false;

async function getServer(): Promise<McpDocsServer> {
  if (!server) {
    const { McpDocsServer } = await import('docusaurus-plugin-mcp-server');
    const { readArtifactBundle } =
      await import('docusaurus-plugin-mcp-server/adapters/node');

    // Use path relative to project root - Vercel's includeFiles puts build/mcp/** in the function
    // __dirname is api/, so we go up one level to project root
    const projectRoot = path.join(__dirname, '..');

    server = new McpDocsServer({
      artifacts: await readArtifactBundle(path.join(projectRoot, 'build/mcp')),
      // Vercel sets this at runtime. It is read here, not at build time,
      // because turbo can reuse a cached build from an earlier commit.
      // `||`, not `??`, so an empty value also falls back to 'dev'.
      version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'dev',
    });
  }

  if (!initialized) {
    await server.initialize();
    initialized = true;
  }

  return server;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).json({
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32600,
        message: 'Method not allowed. Use POST.',
      },
    });
    return;
  }

  try {
    const mcpServer = await getServer();
    await mcpServer.handleHttpRequest(req, res, req.body);
  } catch (error) {
    console.error('MCP Server Error:', error);
    res.status(500).json({
      jsonrpc: '2.0',
      id: (req.body as { id?: unknown })?.id ?? null,
      error: {
        code: -32603,
        message: `Internal server error: ${error instanceof Error ? error.message : String(error)}`,
      },
    });
  }
}
