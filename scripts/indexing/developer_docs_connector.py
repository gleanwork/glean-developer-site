from typing import Union, List
from collections import Counter

from glean.indexing.connectors import BaseDatasourceConnector
from glean.indexing.common.property_definition_builder import PropertyDefinitionBuilder
from glean.indexing.models import (
    ContentDefinition,
    CustomDatasourceConfig,
    DocumentDefinition,
    UserReferenceDefinition
)
from glean.api_client.models import (
    ObjectDefinition,
    PropertyDefinition,
    UIOptions,
    PropertyType,
    DatasourceCategory,
    CustomProperty,
    DocumentPermissionsDefinition
)
from data_types import DocumentationPage, ApiReferencePage

class CustomDeveloperDocsConnector(BaseDatasourceConnector[Union[DocumentationPage, ApiReferencePage]]):
    configuration: CustomDatasourceConfig = CustomDatasourceConfig(
        name="customDeveloperDocsDatasource",
        display_name="Custom Glean Developer Docs",
        datasource_category=DatasourceCategory.KNOWLEDGE_HUB,
        url_regex="https://developers.glean.com/.*",
        icon_url="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAJeElEQVR4Ae2dTUxUVxTHzxsGLAqCiyYOKxZCl+LHwgXWcVcbErvRaNpFNdHooqSRdlEWRVzgotFU2kSjCW40GumiNla7HISFi5ZOl0USXYlJ01TLR5EZeH3/h699IMO8d9+bd++Ze3+JwQlRyDv/e8+555x7nkWr2N35R9Ym6wOyUwcty24lQxVg5W3LztfWLPQ/ymWerviO95ds9knzzGJzH9lLn5KherHo62JNqj+f2/Ji+SMtG3+22JCzKbWdDBpg5Ytpaz9EkMJHrHxjfJ2wO9KLS334m7UnO9VaLNY9IYOGLO1PFQq1Z8mgJQj2U5Zltn5dcYx/MAV/QAYtsW1qTZFBa4wANMcIQHOMADTHCEBzjAA0xwhAc4wANMcIQHOMADTHCEBzjAAEaGy0qFowAghJ14ENdPdOMx059BZVA0YAIchkauhM90ZqbLCox/l64lg9cccIIARXBhtd43ucPF5PN4eaqMURBleMAAJy5pON1LL1zcfV3lZDlx1h7NpRSxwxAggA/P7Rw6V9PoSB3YGjSzACKIPn94MAl9DX27DCTaiOEcA64Li32u+Xo+tAHd24zicuSFMVAYNlttZQ+7blh9+S+V/f09M2Tc/YNPV8iSYmi+7ncpz4uH5Nv18O/JvLlxrp4OEXpDqsBQCD7+qodQOwdztrVxi8HBDDxONFGhldoJGxAj2bWlzxfZzz1/P75bh2/R/igLW788/yS0ExYHAEXIjA4/K3EMOt4XkazxcJD+Tm0Gbh//v28Cu6MDhLHGAlAETj+LNrR2U3LuwOosZ/NrXEYuv3YOECvBVfacN7iBofccXp7r+JE0oLAD4egVgUX5wkF7+Zo2dOkMkJZQXQ3pamrwYahKJwGcDv33vwirihpADg572iCwfg97kEfatRTgA4fvUEzLypAEe/70ep/ZWb8QFHv+9HGQFk99axMz6SPRz9vh8lBICCy5e9m4gbSDtzR7oARAouqoDCD/fWMOlBoGjBZS1++bXopHILbloXBR9E536QOm7flnYTSjs7wtUOSoES8MM1aglckJoKxtb/w50migr88L0HC44ACqH+HY6byDBGFQKEd4rpSUCqAO4ON0da/Xjw5wZmIkfhR51t/ISzkqO4oVPd06EFqALSYgCsvijGRwSOVRfHEQxVwA+PvXzDZYSBa4ewNAFgxYnSf36Wrg7FW29Ho8hHx1+68YMIiCs4NoZKEQAelOjqh/Hv3a/M2RtlYOwqoiIwTaEBwfYvgpt4uV/ZxAtE8FnvtPs1LNgFuB1npQhg397wWyX8c9zbfingDs4NiBV3uJSuPRIXAFK+Iqsk6YJLbnTBPWWEBfkFTiQuAJGuHpzzZRRcRBo7ubmBxAWwUyBSRpJHBjjXi+wCnE4DiQvA69kPCny/zATLyFh48WUyStTYApHob4o2r7Agty+T3MPwAggrcpkkKgAR3zgyKlcAOBGEPRKi4MSFRAWQEUj+iJzH42YqZADKaYRMsjuAwIOZei6/zDrxOHwgyAXlXQBHMkxa2YG5Hl4BVHBbQUlUAFHKrTIJ2/s3YwQQHyqkVsPGLkFmD6hCogKYmAwf0L3TJvdIhbgl7LneuIASTAk0TrZJTqrsc4pXYXk8yadBNFEBYGWELeqguNIiMbWaFRDA74yOjYk/2XGBvL5oA0lU0LUs0ruAlnQuJC4AkTgAly9k5BBOCrR44aQj2lImg8QFINLSBeOfPJ7svUGsftz8CYvs4lVYEhcA4gCRGvuRQxsSrbPjupoIsnoXRJESXYnU2IE7MSSBAYyl5gKXQ3bvgghSBAA3IHJWhivAYOZKigCt3aKNnVxmA/qRIgAY//bwPIngTuF0RNAec4II2b6+Lxrcy54iYPWPm6thwbl1Z144YwYRYJBjXBcxEFvcGGqirvfDB30eP/70iuWkEKmXQ3Ep80zEqSB46NeGxCZ14Lr40UP1QtH+it+B2XBIP9InhV4Z3BzLAEgIYdw5XUAI6wViyCru66xzU7xxDZ7sH5hlOypGugDQPHHzelPsiR4kY/wuBv8/unXj/jkwfP8AzxFxQIlZwXG4Ahlg68eNYk7Vv9Uo0Q+A+/mipwJZwPi4rsbZ+ECZhpALg3Nssmho+Pi8d5r1fEAPpTqC+gdmlBcBjH/x2zmhopaKKHeDASKYmdmo5Pg1GN8dIFElxgdK9gTCHaiWVvUCvjDGR0URJxyVZwkq2xSKYRCYvKVCJzFGwcP4YX1+j1NUQj8hRuD2dG9S8l6E8q+MQZ4A+XkZXUEQ37nzs0IVPqSpV9cVIKDTrqjVcSFs3hmUpBDg629/Ny9cr1jL+H7g4lQ59rJ7a1glheC+Rm5sIVKhqpzxPXDauTg4Kz2PwPK1cQBCQBUPTZt4d6DojVxs8w8do+dGC5GbOYIa/7+frYBLYCuA1UAMCLhQ7Gl7fT9/9SVNXPPGbWP37aHOaofB41qBYY3vBwGvrFNP1QhAFl4jiUj7uB9Zs4ar6t3BSRPXm81k9hIaAQgS1/uNvKKSLIwAQoJYA6XruAZByS4qGQEEBGld3BSK2j7mB4OvZdcVjADKgBWPSykil0TXI4nB10EwAlgDRPZd722ItW/QD4yf1ODrcrAVgJf4iWsah79ZFN3ClSrcqGR8wFYA7vuFnWrb8hvCFt1RbviKxA6SPaWEAUM3NKRWJI2SGPDsNZKosO37YSsArFbgvgrO+UNrBGcQAx48dguZpVgc9RDtq9hIwlYAQXwzjC67Bo8dSuX+QZYC4DKOHY0kqr9WnqUA3C1fYaI0kiQNSwF4/l9FsOqvDs2xuS9gdoCYwNQTHPG4DYhgJwD4f5WaK7Hdu1k9ppdD2QlAldWP6B5X2rga3oOdAGT7f65bfSnMDhAAGB3j36I0i6oKKwGgAycJ/4/sIbJ2I6MLbpcw1zH3QWDZFo4J4sgEIo+PnH7Ud/S40z0ni+6EEa+uUG0rvRRV0RTqjnR/vTtAIJ4g/F3BeImDVxvAV3yG0b3PulIV/QDL00erIyhLGvPOIM0xAtAcIwDNMQLQHCMAzTEC0BwjAM0xAtAcIwDNMQLQHCMAzTEC0JyUbdNTMuhKPkWWfZcMWmJbjgAssr8ng5bU1qT6Uz+PvZ2zyb5EBq2AzR/ltjx1g8DFdM1ZIitPBi2waOm3Rtfmr08B+dyWF8W0td/sBNUPbLwpnc7mHJvj8xvdlHuyf7UWCotnLcva7nzsIAN73JOeE+wj3oPL93/vX4blC//TGGMuAAAAAElFTkSuQmCC",
        is_entity_datasource=False,
        is_test_datasource=True,
        is_user_referenced_by_email=True,
        object_definitions=[
                ObjectDefinition(
                    name="infoPage",
                    display_label="Information Page",
                    doc_category=DatasourceCategory.KNOWLEDGE_HUB,
                    property_definitions=PropertyDefinitionBuilder()
                        .add_property("docSection", "Section", property_type=PropertyType.TEXT, ui_options=UIOptions.SEARCH_RESULT)
                        .add_property("heading", "Heading", property_type=PropertyType.TEXT, ui_options=UIOptions.SEARCH_RESULT, hide_ui_facet=True)
                        .build()
                ),
                ObjectDefinition(
                    name="apiReference",
                    display_label="API Reference",
                    doc_category=DatasourceCategory.KNOWLEDGE_HUB,
                    property_definitions=PropertyDefinitionBuilder()
                        .add_property("apiTag", "API Tag", property_type=PropertyType.PICKLIST, ui_options=UIOptions.SEARCH_RESULT)
                        .add_property("endpoint", "Endpoint", property_type=PropertyType.TEXT, ui_options=UIOptions.SEARCH_RESULT, hide_ui_facet=True)
                        .add_property("method", "HTTP Method", property_type=PropertyType.PICKLIST, ui_options=UIOptions.SEARCH_RESULT, hide_ui_facet=True)
                        .add_property("requestContentType", "Request Content Type", property_type=PropertyType.PICKLIST, ui_options=UIOptions.SEARCH_RESULT, hide_ui_facet=True)
                        .add_property("requestParameters", "Request Parameters", property_type=PropertyType.TEXT, ui_options=UIOptions.SEARCH_RESULT, hide_ui_facet=True)
                        .add_property("requestBody", "Request Body", property_type=PropertyType.TEXT, ui_options=UIOptions.SEARCH_RESULT, hide_ui_facet=True)
                        .add_property("responseContentType", "Response Content Type", property_type=PropertyType.PICKLIST, ui_options=UIOptions.SEARCH_RESULT, hide_ui_facet=True)
                        .add_property("responseBody", "Response Body", property_type=PropertyType.TEXT, ui_options=UIOptions.SEARCH_RESULT, hide_ui_facet=True)
                        .add_property("responseCodes", "Response Codes", property_type=PropertyType.TEXTLIST, ui_options=UIOptions.SEARCH_RESULT, hide_ui_facet=True)
                        .add_property("authentication", "Authentication", property_type=PropertyType.PICKLIST, ui_options=UIOptions.SEARCH_RESULT, hide_ui_facet=True)
                        .add_property("pythonCodeSample", "Python Code Sample", property_type=PropertyType.TEXT, ui_options=UIOptions.SEARCH_RESULT, hide_ui_facet=True)
                        .add_property("goCodeSample", "Go Code Sample", property_type=PropertyType.TEXT, ui_options=UIOptions.SEARCH_RESULT, hide_ui_facet=True)
                        .add_property("javaCodeSample", "Java Code Sample", property_type=PropertyType.TEXT, ui_options=UIOptions.SEARCH_RESULT, hide_ui_facet=True)
                        .add_property("typescriptCodeSample", "TypeScript Code Sample", property_type=PropertyType.TEXT, ui_options=UIOptions.SEARCH_RESULT, hide_ui_facet=True)
                        .add_property("curlCodeSample", "Curl Code Sample", property_type=PropertyType.TEXT, ui_options=UIOptions.SEARCH_RESULT, hide_ui_facet=True)
                        .build()
                )
            ]
    )

    def transform(self, data: List[Union[DocumentationPage, ApiReferencePage]]) -> List[DocumentDefinition]:
        documents = []
        for page in data:
            if page["page_type"] == "info_page":
                document = DocumentDefinition(
                    id=page["id"],
                    title=page["title"],
                    datasource=self.name,
                    view_url=page["url"],
                    object_type="infoPage",
                    body=ContentDefinition(mime_type="text/plain", text_content=page["content"]),
                    custom_properties=[
                        CustomProperty(name="docSection", value=page["section"]),
                        CustomProperty(name="heading", value=page["heading"]),
                    ],
                    permissions=DocumentPermissionsDefinition(
                        allow_anonymous_access=True
                    )
                )
            elif page["page_type"] == "api_reference":
                document = DocumentDefinition(
                    id=page["id"],
                    title=page["title"],
                    datasource=self.name,
                    view_url=page["url"],
                    object_type="apiReference",
                    summary=ContentDefinition(mime_type="text/plain", text_content=page["description"]),
                    custom_properties=[
                        CustomProperty(name="apiTag", value=page["tag"]),
                        CustomProperty(name="endpoint", value=page["endpoint"]),
                        CustomProperty(name="method", value=page["method"]),
                        CustomProperty(name="requestContentType", value=page["request_content_type"]),
                        CustomProperty(name="requestParameters", value=page["request_parameters"]),
                        CustomProperty(name="requestBody", value=page["request_body"]),
                        CustomProperty(name="responseContentType", value=page["response_content_type"]),
                        CustomProperty(name="responseBody", value=page["response_body"]),
                        CustomProperty(name="responseCodes", value=page["response_codes"]),
                        CustomProperty(name="authentication", value=page["authentication"]),
                        CustomProperty(name="pythonCodeSample", value=page["python_code_sample"]),
                        CustomProperty(name="goCodeSample", value=page["go_code_sample"]),
                        CustomProperty(name="javaCodeSample", value=page["java_code_sample"]),
                        CustomProperty(name="typescriptCodeSample", value=page["typescript_code_sample"]),
                        CustomProperty(name="curlCodeSample", value=page["curl_code_sample"]),
                    ],
                    permissions=DocumentPermissionsDefinition(
                        allow_anonymous_access=True
                    )
                )
            documents.append(document)
        return documents
