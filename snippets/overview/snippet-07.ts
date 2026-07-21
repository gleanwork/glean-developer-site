import { useState, useEffect } from 'react';
import { Glean } from '@gleanwork/api-client';

const SearchComponent = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const client = new Glean({
    apiToken: process.env.REACT_APP_GLEAN_TOKEN,
    serverURL: process.env.REACT_APP_GLEAN_SERVER_URL
  });
  
  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const response = await client.client.search.query({
        query: searchQuery,
        pageSize: 20,
      });
      setResults(response.results || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleSearch(query)}
        placeholder="Search your organization's knowledge..."
      />
      
      {loading && <div>Searching...</div>}
      
      <div>
        {results.map((result, index) => (
          <div key={index} className="search-result">
            <h3><a href={result.url}>{result.title}</a></h3>
            <p>{result.snippets?.[0]?.snippet}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
