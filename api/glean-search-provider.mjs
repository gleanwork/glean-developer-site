/**
 * Glean Search Provider for MCP Server
 *
 * Uses Glean's search API to power the MCP docs_search tool.
 * This allows AI agents to search Glean-indexed documentation.
 *
 * Required environment variables:
 * - GLEAN_API_TOKEN: Your Glean API token (Client API token, not Indexing token)
 * - GLEAN_SERVER_URL: Your Glean server URL (e.g., 'https://your-company-be.glean.com')
 */

import { Glean } from '@gleanwork/api-client';
import { v5 as uuidv5 } from 'uuid';

const DATASOURCE = 'devdocs';

// The indexer (scripts/indexing) gives every page one of these object types,
// and Glean's document id includes it. Which one a page gets depends on
// whether it is a generated endpoint page, which is decided from source files
// this function cannot see. Asking for both ids in one call keeps the lookup
// exact without copying that rule here, where it could drift.
const OBJECT_TYPES = ['infoPage', 'apiReference'];

function candidateDocIds(url) {
  const uuid = uuidv5(url, uuidv5.URL);
  return OBJECT_TYPES.map(
    (objectType) => `CUSTOM_${DATASOURCE.toUpperCase()}_${objectType}_${uuid}`,
  );
}

export default class GleanSearchProvider {
  name = 'glean';
  client = null;
  baseUrl = '';
  ready = false;

  async initialize(context, _initData) {
    const apiToken = process.env.GLEAN_API_TOKEN;
    const serverURL = process.env.GLEAN_SERVER_URL;

    if (!apiToken) {
      throw new Error(
        '[Glean] GLEAN_API_TOKEN environment variable is required',
      );
    }

    if (!serverURL) {
      throw new Error(
        "[Glean] GLEAN_SERVER_URL environment variable is required (e.g. 'https://your-company-be.glean.com')",
      );
    }

    this.client = new Glean({ apiToken, serverURL });

    this.baseUrl = context.baseUrl;
    this.ready = true;

    console.log(`[Glean] Initialized search provider for ${serverURL}`);
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
   * Get a document. Looks it up by its deterministic docId first (avoids stale
   * URL→docId mappings in Glean's index), then falls back to URL lookup.
   *
   * Returns null only when Glean answered and has no such page, which the
   * plugin reports as "Page not found". If Glean could not answer (a rate
   * limit, an auth failure, an outage), this throws, and the plugin returns a
   * tool error instead. Reporting that as a missing page tells the client to
   * give up on a page that exists.
   */
  async getDocument(url) {
    if (!this.client) {
      throw new Error('[Glean] Provider not initialized');
    }

    const ids = candidateDocIds(url);

    const result = await this.#retrieve(
      url,
      ids.map((id) => ({ id })),
      `id=${ids.join('|')}`,
    );
    if (result) {
      return result;
    }

    console.warn(
      `[Glean] docId lookup returned no document for ${url}; falling back to URL lookup`,
    );
    return this.#retrieve(url, [{ url }], `url=${url}`);
  }

  async #retrieve(url, documentSpecs, label) {
    let response;
    try {
      response = await this.client.client.documents.retrieve({
        documentSpecs,
        includeFields: ['DOCUMENT_CONTENT'],
      });
    } catch (error) {
      console.error(
        `[Glean] Get document error (${label}):`,
        error.message || error,
      );
      throw error;
    }

    // Glean keys results by the requested id or URL. A spec with no document
    // comes back with an `error`, or (for URLs) with empty content; skip those
    // and use the first spec that has the page.
    for (const doc of Object.values(response.documents ?? {})) {
      const fullText = doc?.error
        ? ''
        : (doc?.content?.fullTextList ?? []).join('\n\n');
      if (fullText) {
        return {
          url,
          title: doc.title ?? 'Untitled',
          description: doc.metadata?.description ?? '',
          markdown: fullText,
          headings: [],
        };
      }
    }

    console.warn(`[Glean] No document for ${url} via ${label}`);
    return null;
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
        message: `Connected to Glean: ${process.env.GLEAN_SERVER_URL}`,
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
