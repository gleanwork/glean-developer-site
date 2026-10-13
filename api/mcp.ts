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
 *
 * The plugin's Node handler answers every method: POST for MCP, GET for a
 * status check (name, version, document and skill counts), OPTIONS for CORS
 * preflight, and 405 for the rest. It allows every origin, which is fine for a
 * public, read-only, credential-free server.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import path from 'path';

type NodeHandler = (req: VercelRequest, res: VercelResponse) => Promise<void>;

// Created on the first request and reused by a warm instance. The handler
// reads the bundle and initializes the server lazily, once.
let handler: Promise<NodeHandler> | null = null;

function getHandler(): Promise<NodeHandler> {
  if (!handler) {
    // A dynamic import, because the plugin is ESM-only and this function
    // compiles to CommonJS (see api/tsconfig.json).
    handler = import('docusaurus-plugin-mcp-server/adapters/node').then(
      ({ createNodeHandler }) =>
        createNodeHandler({
          // Vercel's includeFiles puts build/mcp/** in the function. __dirname
          // is api/, so the build is one level up.
          artifactsDir: path.join(__dirname, '..', 'build/mcp'),
          // Vercel sets this at runtime. It is read here, not at build time,
          // because turbo can reuse a cached build from an earlier commit.
          // `||`, not `??`, so an empty value also falls back to 'dev'.
          version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'dev',
        }),
    );
  }
  return handler;
}

export default async function mcp(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  const handle = await getHandler();
  await handle(req, res);
}
