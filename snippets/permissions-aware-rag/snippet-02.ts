const glean = new Glean({ apiToken: ..., instance: ... });

const response = await glean.client.search.query({ query: question, pageSize: 8 });

const sources = (response.results ?? [])
  .filter((r) => r.title && r.snippets)
  .map((r) => ({
    title: r.title!,
    url: r.url,
    text: r.snippets!.map((s) => s.text ?? '').join('\n'),
  }));
