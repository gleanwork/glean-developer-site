const glean = new Glean({ apiToken: ..., instance: ... });

const response = await glean.search.query({ query: question, page_size: 8 });

const sources = (response.results ?? [])
  .filter((r) => r.title && r.snippets)
  .map((r) => ({
    title: r.title!,
    url: r.url,
    text: r.snippets!.filter(Boolean).join('\n'),
  }));
