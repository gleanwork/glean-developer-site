/**
 * Code snippets for the homepage redesign — every snippet is sourced from
 * published docs (never invented):
 * - chat/search: docs/libraries/api-clients/python.mdx
 * - indexing:    scripts/indexing/ (this repo's own glean-indexing-sdk connector)
 * - agents:      docs/guides/agents/toolkit.mdx
 * - typescript:  docs/libraries/api-clients/typescript.mdx
 * - curl:        docs/api-info/client/getting-started/basic-usage.mdx
 * - web sdk:     docs/libraries/web-sdk/components/{chat,autocomplete}.mdx
 */

export type HeroSlide = {
  surface: string;
  headline: string;
  subcopy: string;
  filename: string;
  code: string;
};

export const HERO_SLIDES: HeroSlide[] = [
  {
    surface: 'Chat API',
    headline: 'Chat grounded in company knowledge',
    subcopy:
      'Ask across every connected app and get permission-aware answers, with citations, in a single API call.',
    filename: 'chat.py',
    code: `from glean.api_client import Glean

with Glean(
    api_token=os.environ["GLEAN_API_TOKEN"],
    server_url=os.environ["GLEAN_SERVER_URL"],
) as client:
    response = client.client.chat.create(
        messages=[{"fragments":
            [{"text": "Summarize the Q3 roadmap"}]}]
    )
    print(response.text)`,
  },
  {
    surface: 'Search API',
    headline: 'Search your entire knowledge graph',
    subcopy:
      'Enterprise search over 100+ connected sources — ranked, permission-aware, and fast, from one query.',
    filename: 'search.py',
    code: `from glean.api_client import Glean

with Glean(
    api_token=os.environ["GLEAN_API_TOKEN"],
    server_url=os.environ["GLEAN_SERVER_URL"],
) as glean:
    results = glean.client.search.query(
        query="quarterly reports",
        page_size=10,
    )
    titles = [r.title for r in results.results]`,
  },
  {
    surface: 'Agents',
    headline: "Build agents on your company's knowledge",
    subcopy:
      'Plan, retrieve, and act across your tools — agents reason over the knowledge graph, not just a prompt window.',
    filename: 'agent.py',
    code: `from glean.agent_toolkit.tools import (
    glean_search,
    employee_search,
)

# Use with LangChain
search_tool = glean_search.as_langchain_tool()
people_tool = employee_search.as_langchain_tool()

# Use with CrewAI
crew_tool = glean_search.as_crewai_tool()`,
  },
  {
    surface: 'Web SDK',
    headline: 'Embed Glean in your apps',
    subcopy:
      'Drop permission-aware search and chat into the tools your team already uses — a script tag and two components.',
    filename: 'embed.html',
    code: `<script defer
  src="https://{GLEAN_APP_DOMAIN}/embedded-search-latest.min.js">
</script>

<script>
  window.GleanWebSDK.renderSearchBox(searchEl, {
    onSearch: (query) =>
      window.GleanWebSDK.renderSearchResults(
        resultsEl, { query }),
  });
  window.EmbeddedSearch.renderChat(chatEl);
</script>`,
  },
  {
    surface: 'Indexing SDK',
    headline: 'Bring any data into Glean',
    subcopy:
      'Build a connector on the open-source indexing SDK — push documents from any source and make them searchable everywhere.',
    filename: 'connector.py',
    code: `from glean.indexing.connectors import (
    BaseDatasourceConnector,
)

class CatalogConnector(BaseDatasourceConnector):
    def get_data(self):
        return load_catalog_pages()

connector = CatalogConnector(name="catalog")
connector.index_data(mode=IndexingMode.FULL)`,
  },
];

export const QUICKSTART_SNIPPETS: Record<
  string,
  { label: string; code: string }
> = {
  python: {
    label: 'Python',
    code: `from glean.api_client import Glean

with Glean(
    api_token=os.environ["GLEAN_API_TOKEN"],
    server_url=os.environ["GLEAN_SERVER_URL"],
) as glean:
    results = glean.client.search.query(
        query="quarterly planning",
        page_size=10,
    )
    for r in results.results:
        print(r.title, r.url)`,
  },
  typescript: {
    label: 'TypeScript',
    code: `import { Glean } from "@gleanwork/api-client";

const client = new Glean({
  apiToken: process.env.GLEAN_API_TOKEN,
  serverURL: process.env.GLEAN_SERVER_URL,
});

const results = await client.client.search.query({
  query: "quarterly planning",
  pageSize: 10,
});

results.results?.forEach((r) => console.log(r.title));`,
  },
  curl: {
    label: 'cURL',
    code: `curl -X POST https://your-instance-be.glean.com/rest/api/v1/search \\
  -H 'Authorization: Bearer <your_token>' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "query": "quarterly planning",
    "pageSize": 10
  }'`,
  },
};

export const AGENTS_BAND_CODE = `from glean.agent_toolkit.tools import (
    glean_search,
    employee_search,
)

# LangChain
lc_tool = glean_search.as_langchain_tool()

# CrewAI
crew_tool = glean_search.as_crewai_tool()`;

export const SDK_CARDS = [
  { name: 'Python', icon: 'python', install: 'pip install glean-api-client' },
  {
    name: 'TypeScript',
    icon: 'typescript',
    install: 'npm install @gleanwork/api-client',
  },
  { name: 'Java', icon: 'java', install: 'com.glean.api-client' },
  {
    name: 'Go',
    icon: 'go',
    install: 'go get github.com/gleanwork/api-client-go',
  },
];
