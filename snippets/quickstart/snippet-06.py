import os
from datetime import datetime
from typing import List

from glean.indexing.connectors import BaseDatasourceConnector
from glean.indexing.models import (
    ContentDefinition,
    CustomDatasourceConfig,
    DocumentDefinition,
    UserReferenceDefinition,
)


class CompanyWikiConnector(BaseDatasourceConnector[WikiPage]):
    configuration = CustomDatasourceConfig(
        name="companywiki",
        display_name="Company Wiki",
        url_regex=r"https://wiki\.company\.com/.*",
        is_user_referenced_by_email=True,
    )

    def transform(self, data: Sequence[WikiPage]) -> List[DocumentDefinition]:
        return [
            DocumentDefinition(
                id=page["id"],
                title=page["title"],
                datasource=self.name,
                view_url=page["url"],
                body=ContentDefinition(mime_type="text/plain", text_content=page["content"]),
                author=UserReferenceDefinition(email=page["author"]),
                updated_at=int(
                    datetime.fromisoformat(page["updated_at"].replace("Z", "+00:00")).timestamp()
                ),
            )
            for page in data
        ]


def create_connector() -> CompanyWikiConnector:
    """Construct the connector from runtime configuration."""
    return CompanyWikiConnector(
        name="companywiki",
        data_client=WikiDataClient(
            base_url=os.environ["WIKI_BASE_URL"],
            api_token=os.environ["WIKI_API_TOKEN"],
        ),
    )
