from typing import List, TypedDict

class DocumentationPage(TypedDict):
    """Type definition for Page Information data."""

    id: str
    title: str
    section: str
    heading: str
    content: str
    url: str
    page_type: str

class ApiReferencePage(TypedDict):
    """Type definition for API Reference data."""
    
    id: str
    title: str
    tag: str # tag the endpoint belongs to (Activity, Announcements, etc.)
    endpoint: str
    method: str
    description: str
    request_content_type: str
    request_query_parameters: str
    request_path_parameters: str
    request_body: str
    response_content_type: str
    response_body: str
    response_codes: List[str]
    authentication: str
    python_code_sample: str
    go_code_sample: str
    java_code_sample: str
    typescript_code_sample: str
    curl_code_sample: str
    url: str
    page_type: str
