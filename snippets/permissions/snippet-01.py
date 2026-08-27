from glean.api_client.models import (
    DocumentDefinition,
    DocumentPermissionsDefinition,
    PermissionsGroupIntersectionDefinition,
    UserReferenceDefinition,
)


def transform(self, data):
    return [
        DocumentDefinition(
            id=article["id"],
            title=article["title"],
            datasource=self.name,
            view_url=article["url"],
            permissions=DocumentPermissionsDefinition(
                allowed_groups=article["visible_to_groups"],
                allowed_users=[
                    UserReferenceDefinition(email=email)
                    for email in article["visible_to_users"]
                ],
                allowed_group_intersections=[
                    PermissionsGroupIntersectionDefinition(
                        required_groups=["engineering", "employees"]
                    )
                ],
            ),
        )
        for article in data
    ]
