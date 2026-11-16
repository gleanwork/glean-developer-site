import { describe, expect, it } from 'vitest';
import {
  customApiMdGenerator,
  isAgentRoutedOperation,
} from './customMdGenerators';

function generate(method: string, path: string): string {
  return customApiMdGenerator({
    title: 'Search',
    api: { method, path, responses: {} },
    infoPath: 'api/platform-api/glean-platform-api',
    frontMatter: {},
  });
}

describe('isAgentRoutedOperation', () => {
  it('matches the Platform and Client search operations', () => {
    expect(
      isAgentRoutedOperation({ method: 'post', path: '/api/search' }),
    ).toBe(true);
    expect(
      isAgentRoutedOperation({ method: 'POST', path: '/rest/api/v1/search' }),
    ).toBe(true);
  });

  it('ignores other operations', () => {
    expect(
      isAgentRoutedOperation({ method: 'get', path: '/api/search/filters' }),
    ).toBe(false);
    expect(
      isAgentRoutedOperation({ method: 'post', path: '/rest/api/v1/chat' }),
    ).toBe(false);
  });
});

describe('customApiMdGenerator agent routing', () => {
  it('adds the routing partial and note to search pages', () => {
    const mdx = generate('post', '/api/search');
    expect(mdx).toContain(
      'import AgentRetrievalRouting from "@site/docs/_partials/_agent-retrieval-routing.mdx";',
    );
    expect(mdx).toContain('<AgentRetrievalRouting />');
    expect(mdx).toContain('use the [Remote MCP server](/guides/mcp)');
  });

  it('leaves other pages unchanged', () => {
    const mdx = generate('post', '/rest/api/v1/chat');
    expect(mdx).not.toContain('AgentRetrievalRouting');
  });
});
