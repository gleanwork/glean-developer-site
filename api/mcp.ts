/**
 * Vercel API route for MCP server
 * Deploy to Vercel and this will be available at /api/mcp
 * With the rewrite in vercel.json, also available at /mcp
 *
 * Searches the build's own index (build/mcp/search-index.json) in process,
 * so it needs no credentials and makes no outbound calls. It also serves the
 * site's docs-research skill (mcp-skills/) from build/mcp/skills.json.
 *
 * The server name comes from build/mcp/manifest.json, which the build writes
 * from the plugin options in docusaurus.config.ts. The version is the commit
 * of the deploy serving the request, so a bad answer can be traced to it.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { McpDocsServer, McpManifest } from 'docusaurus-plugin-mcp-server';
import { readFile } from 'fs/promises';
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
    const manifest = JSON.parse(
      await readFile(path.join(projectRoot, 'build/mcp/manifest.json'), 'utf8'),
    ) as McpManifest;

    server = new McpDocsServer({
      docsPath: path.join(projectRoot, 'build/mcp/docs.json'),
      indexPath: path.join(projectRoot, 'build/mcp/search-index.json'),
      name: manifest.serverName,
      // Vercel sets this at runtime. It is read here, not at build time,
      // because turbo can reuse a cached build from an earlier commit.
      version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'dev',
      baseUrl: 'https://developers.glean.com',
      skillsPath: path.join(projectRoot, 'build/mcp/skills.json'),
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
