import time
from datetime import datetime, timedelta
from collections import deque

class RateLimitedAgent(CustomAgent):
    def __init__(self, requests_per_minute: int = 60):
        super().__init__()
        self.requests_per_minute = requests_per_minute
        self.request_times = deque()
    
    def _wait_if_needed(self):
        """Implement rate limiting"""
        now = datetime.now()
        
        # Remove requests older than 1 minute
        while self.request_times and now - self.request_times[0] > timedelta(minutes=1):
            self.request_times.popleft()
        
        # Check if we need to wait
        if len(self.request_times) >= self.requests_per_minute:
            sleep_time = 60 - (now - self.request_times[0]).total_seconds()
            if sleep_time > 0:
                print(f"Rate limit reached, waiting {sleep_time:.1f} seconds...")
                time.sleep(sleep_time)
        
        # Record this request
        self.request_times.append(now)
    
    def process_query(self, query: str) -> dict:
        self._wait_if_needed()
        return super().process_query(query)
