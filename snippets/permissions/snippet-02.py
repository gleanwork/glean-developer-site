from glean.indexing.models import DatasourceIdentityDefinitions


def get_identities(self) -> DatasourceIdentityDefinitions:
    return DatasourceIdentityDefinitions(
        users=fetch_users(),
        groups=fetch_groups(),
        memberships=fetch_memberships(),
    )
