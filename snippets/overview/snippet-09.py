import hashlib
import time

class CachedSearchClient:
    def __init__(self, client: Glean):
        self.client = client
        self._cache = {}
    
    def _cache_key(self, query: str) -> str:
        return hashlib.md5(query.encode()).hexdigest()
    
    def search(self, query: str, cache_ttl: int = 300):
        cache_key = self._cache_key(query)

        if cache_key in self._cache:
            cached_result, timestamp = self._cache[cache_key]
            if time.time() - timestamp < cache_ttl:
                return cached_result

        result = self.client.client.search.query(query=query)

        self._cache[cache_key] = (result, time.time())
        return result
