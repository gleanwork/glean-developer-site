/**
 * Vercel API route for MCP server
 * Deploy to Vercel and this will be available at /api/mcp
 * With the rewrite in vercel.json, also available at /mcp
 *
 * Uses Glean search provider to search documentation via Glean's API.
 *
 * Required environment variables:
 * - GLEAN_API_TOKEN: Your Glean API token (Client API token)
 * - GLEAN_INSTANCE: Your Glean instance name (e.g., 'glean' for glean-be.glean.com)
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

    // Use path relative to project root - Vercel's includeFiles puts build/mcp/** in the function
    // __dirname is api/, so we go up one level to project root
    const projectRoot = path.join(__dirname, '..');

    server = new McpDocsServer({
      docsPath: path.join(projectRoot, 'build/mcp/docs.json'),
      indexPath: path.join(projectRoot, 'build/mcp/search-index.json'),
      name: 'glean-developer-docs',
      version: '1.0.0',
      baseUrl: 'https://developers.glean.com',
      // Use Glean search provider instead of local FlexSearch
      search: path.join(__dirname, 'glean-search-provider.mjs'),
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
  res: VercelResponse
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
