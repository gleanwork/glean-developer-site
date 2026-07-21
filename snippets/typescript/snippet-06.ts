const results = await client.client.search.query({
  query: "quarterly business review",
  pageSize: 10
});

results.results?.forEach(result => {
  console.log(`Title: ${result.title}`);
  console.log(`URL: ${result.url}`);
});
