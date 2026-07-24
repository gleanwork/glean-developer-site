from glean.indexing.models import ContentDefinition, DocumentDefinition
from glean.api_client.models import DocumentPermissionsDefinition, UserReferenceDefinition

def transform(self, data):
    return [
        DocumentDefinition(
            id=item["id"],
            title=item["title"],
            datasource=self.name,
            view_url=item["view_url"],
            object_type="document",
            body=ContentDefinition(mime_type="text/plain", text_content=item["body"]),
            permissions=DocumentPermissionsDefinition(allowed_groups=item["groups"]),
            created_at=item["created_at_epoch_seconds"],
            updated_at=item["updated_at_epoch_seconds"],
        )
        for item in data
    ]
