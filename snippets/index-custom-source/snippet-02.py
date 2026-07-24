from glean.api_client.models import DatasourceCategory, ObjectDefinition
from glean.indexing.connectors import BaseDatasourceConnector
from glean.indexing.models import CustomDatasourceConfig

class AcmeCorpusConnector(BaseDatasourceConnector[dict]):
    configuration: CustomDatasourceConfig = CustomDatasourceConfig(
        name="acme_corpus",
        display_name="Acme Corpus",
        datasource_category=DatasourceCategory.KNOWLEDGE_HUB,
        url_regex="https://portal.acme.internal/.*",
        is_entity_datasource=False,
        is_test_datasource=False,
        is_user_referenced_by_email=True,
        object_definitions=[
            ObjectDefinition(
                name="document",
                display_label="Document",
                doc_category=DatasourceCategory.KNOWLEDGE_HUB,
            ),
        ],
    )
