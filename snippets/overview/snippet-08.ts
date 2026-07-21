const FilteredSearchComponent = () => {
  const [filters, setFilters] = useState({
    datasources: [],
    dateRange: null,
    objectTypes: []
  });
  
  const applyFilters = async (query: string) => {
    const facetFilters = [];
    
    if (filters.datasources.length > 0) {
      facetFilters.push({
        fieldName: "app",
        values: filters.datasources.map((d) => ({
          value: d,
          relationType: "EQUALS",
        })),
      });
    }

    if (filters.objectTypes.length > 0) {
      facetFilters.push({
        fieldName: "type",
        values: filters.objectTypes.map((t) => ({
          value: t,
          relationType: "EQUALS",
        })),
      });
    }

    const response = await client.client.search.query({
      query,
      requestOptions: { facetBucketSize: 10, facetFilters },
    });
    
    return response.results;
  };
  
  // UI implementation...
};
