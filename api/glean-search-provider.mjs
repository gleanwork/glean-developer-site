/**
 * Glean Search Provider for MCP Server
 *
 * Uses Glean's search API to power the MCP docs_search tool.
 * This allows AI agents to search Glean-indexed documentation.
 *
 * Required environment variables:
 * - GLEAN_API_TOKEN: Your Glean API token (Client API token, not Indexing token)
 * - GLEAN_INSTANCE: Your Glean instance name (e.g., 'glean' for glean-be.glean.com)
 */

import { Glean } from '@gleanwork/api-client';

export default class GleanSearchProvider {
  name = 'glean';
  client = null;
  baseUrl = '';
  ready = false;

  async initialize(context, _initData) {
    const apiToken = process.env.GLEAN_API_TOKEN;
    const instance = process.env.GLEAN_INSTANCE;

    if (!apiToken) {
      throw new Error(
        '[Glean] GLEAN_API_TOKEN environment variable is required',
      );
    }

    if (!instance) {
      throw new Error(
        '[Glean] GLEAN_INSTANCE environment variable is required',
      );
    }

    this.client = new Glean({
      apiToken,
      instance,
    });

    this.baseUrl = context.baseUrl;
    this.ready = true;

    console.log(
      `[Glean] Initialized search provider for instance: ${instance}`,
    );
  }

  isReady() {
    return this.ready && this.client !== null;
  }

  async search(query, options) {
    if (!this.client) {
      throw new Error('[Glean] Provider not initialized');
    }

    const pageSize = options?.limit ?? 15;

    try {
      const request = {
        query,
        pageSize,
        returnLlmContentOverSnippets: true,
        maxSnippetSize: 2000,
      };

      const response = await this.client.client.search.query(request);
      return this.transformResults(response.results ?? []);
    } catch (error) {
      console.error('[Glean] Search error:', error);
      throw error;
    }
  }

  /**
   * Get a document by URL.
   */
  async getDocument(url) {
    if (!this.client) {
      throw new Error('[Glean] Provider not initialized');
    }

    try {
      const response = await this.client.client.documents.retrieve({
        documentSpecs: [{ url }],
        includeFields: ['DOCUMENT_CONTENT'],
      });

      // Response is a map keyed by document identifier
      const docs = response.documents;
      if (!docs) {
        return null;
      }

      // Get the first (and only) document from the map
      const docKey = Object.keys(docs)[0];
      const doc = docs[docKey];

      if (!doc || doc.error) {
        return null;
      }

      // Content is in doc.content.fullTextList as an array of strings
      const fullText = doc.content?.fullTextList?.join('\n\n') ?? '';

      return {
        url,
        title: doc.title ?? 'Untitled',
        description: doc.metadata?.description ?? '',
        markdown: fullText,
        headings: [],
      };
    } catch (error) {
      console.error('[Glean] Get document error:', error.message || error);
      throw error; // Re-throw to see full error in response
    }
  }

  async healthCheck() {
    if (!this.client) {
      return { healthy: false, message: 'Glean client not initialized' };
    }

    try {
      const request = {
        query: 'test',
        pageSize: 1,
      };

      await this.client.client.search.query(request);

      return {
        healthy: true,
        message: `Connected to Glean instance: ${process.env.GLEAN_INSTANCE}`,
      };
    } catch (error) {
      return {
        healthy: false,
        message: `Glean health check failed: ${String(error)}`,
      };
    }
  }

  /**
   * Transform Glean search results to the plugin's SearchResult format
   */
  transformResults(gleanResults) {
    return gleanResults.map((result, index) => {
      // Glean returns URL in document.url, not result.url
      const docUrl = result.document?.url ?? result.url ?? '';

      let route = '/';
      let fullUrl = docUrl;

      if (docUrl) {
        try {
          const url = new URL(docUrl);
          route = url.pathname;
          fullUrl = docUrl;
        } catch {
          route = docUrl.startsWith('/') ? docUrl : `/${docUrl}`;
          fullUrl = `${this.baseUrl}${route}`;
        }
      }

      const snippet =
        result.snippets?.[0]?.text ?? result.snippets?.[0]?.snippet ?? '';

      return {
        route,
        url: fullUrl,
        title: result.title ?? result.document?.title ?? 'Untitled',
        score: 1 - index * 0.1,
        snippet,
        matchingHeadings: [],
      };
    });
  }
}
