import hashlib
import json
from datetime import datetime, timedelta

class CachedAgent(CustomAgent):
    def __init__(self, cache_ttl_minutes=30):
        super().__init__()
        self._cache = {}
        self.cache_ttl = timedelta(minutes=cache_ttl_minutes)
    
    def _cache_key(self, query: str, filters: dict = None) -> str:
        """Generate cache key from query and filters"""
        cache_data = {"query": query, "filters": filters or {}}
        cache_string = json.dumps(cache_data, sort_keys=True)
        return hashlib.md5(cache_string.encode()).hexdigest()
    
    def _is_cache_valid(self, timestamp: datetime) -> bool:
        """Check if cache entry is still valid"""
        return datetime.now() - timestamp < self.cache_ttl
    
    def process_query(self, query: str, filters: dict = None) -> dict:
        cache_key = self._cache_key(query, filters)
        
        # Check cache
        if cache_key in self._cache:
            cached_result, timestamp = self._cache[cache_key]
            if self._is_cache_valid(timestamp):
                print("Returning cached result")
                return cached_result
        
        # Process query
        result = super().process_query(query)
        
        # Cache result
        self._cache[cache_key] = (result, datetime.now())
        
        return result
