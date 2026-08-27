from typing import Any, Optional, Sequence, TypedDict

from glean.indexing.connectors import BaseDataClient


class WikiPage(TypedDict):
    id: str
    title: str
    content: str
    author: str
    updated_at: str
    url: str


class WikiDataClient(BaseDataClient[WikiPage]):
    def __init__(self, base_url: str, api_token: str):
        self.base_url = base_url
        self.api_token = api_token

    def get_source_data(self, since: Optional[str] = None, **kwargs: Any) -> Sequence[WikiPage]:
        # Replace with a real API call against your source.
        return [
            {
                "id": "page_123",
                "title": "Engineering Onboarding Guide",
                "content": "Welcome to the engineering team...",
                "author": "jane.smith@company.com",
                "updated_at": "2026-02-01T14:30:00Z",
                "url": f"{self.base_url}/pages/123",
            }
        ]
