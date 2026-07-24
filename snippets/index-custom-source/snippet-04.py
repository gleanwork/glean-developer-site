from glean.api_client.models import (
    DatasourceBulkMembershipDefinition,
    DatasourceGroupDefinition,
    DatasourceUserDefinition,
)
from glean.indexing.models import DatasourceIdentityDefinitions

def get_identities(self):
    return DatasourceIdentityDefinitions(
        users=[DatasourceUserDefinition(email="dana.okafor@acme.example.com", name="Dana Okafor")],
        groups=[DatasourceGroupDefinition(name="Acme-HR")],
        memberships=[
            DatasourceBulkMembershipDefinition(
                member_user_id="dana.okafor@acme.example.com",
                member_group_name="Acme-HR",
            ),
        ],
    )
