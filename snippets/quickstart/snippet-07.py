from glean.indexing.testing import StaticDataClient, run_connector

result = run_connector(CompanyWikiConnector("companywiki", StaticDataClient([
    {
        "id": "page_123",
        "title": "Engineering Onboarding Guide",
        "content": "Welcome...",
        "author": "jane.smith@company.com",
        "updated_at": "2026-02-01T14:30:00Z",
        "url": "https://wiki.company.com/pages/123",
    }
])))

result.assert_documents_posted(count=1, datasource="companywiki")
