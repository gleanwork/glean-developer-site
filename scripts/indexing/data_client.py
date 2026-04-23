"""Data client that reads documentation content from Docusaurus build output.

Instead of scraping the live site with Playwright, this reads from:
- build/mcp/docs.json — full markdown for all pages
- docs/api/**/*.RequestSchema.json — request schemas
- docs/api/**/*.StatusCodes.json — response codes
- docs/api/**/*.ParamsDetails.json — query/path parameters
- openapi/client/split-apis/*.yaml — code samples via x-codeSamples
- openapi/client/split-apis/split-info.json — endpoint-to-file mapping
"""

from typing import Union, List, Optional, TYPE_CHECKING
from pathlib import Path
import uuid
import json
import logging

import yaml

from data_types import DocumentationPage, ApiReferencePage

if TYPE_CHECKING:
    from indexing_logger import IndexingLogger

logger = logging.getLogger(__name__)


class DeveloperDocsDataClient:
    """Reads documentation content from Docusaurus build output files."""

    def __init__(
        self,
        repo_root: Optional[str] = None,
        indexing_logger: Optional["IndexingLogger"] = None,
    ):
        if repo_root is None:
            repo_root = str(Path(__file__).parent.parent.parent)
        self.repo_root = Path(repo_root)
        self.indexing_logger = indexing_logger

        self.docs_json_path = self.repo_root / "build" / "mcp" / "docs.json"
        self.api_docs_dir = self.repo_root / "docs" / "api"
        self.split_info_path = (
            self.repo_root / "openapi" / "client" / "split-apis" / "split-info.json"
        )
        self.openapi_dir = self.repo_root / "openapi" / "client" / "split-apis"
        self.indexing_openapi_path = (
            self.repo_root / "openapi" / "indexing" / "indexing-capitalized.yaml"
        )

        self._split_info = None
        self._openapi_specs = {}

    def _log(self, msg: str) -> None:
        if self.indexing_logger:
            self.indexing_logger.log(msg)

    def _load_split_info(self) -> dict:
        """Load the split-info.json that maps endpoints to OpenAPI YAML files."""
        if self._split_info is None:
            if self.split_info_path.exists():
                self._split_info = json.loads(self.split_info_path.read_text())
            else:
                self._split_info = {"tags": []}
        return self._split_info

    def _load_openapi_spec(self, yaml_file: str) -> dict:
        """Load and cache an OpenAPI YAML spec file."""
        if yaml_file not in self._openapi_specs:
            path = self.openapi_dir / yaml_file
            if path.exists():
                self._openapi_specs[yaml_file] = yaml.safe_load(path.read_text())
            else:
                self._openapi_specs[yaml_file] = {}
        return self._openapi_specs[yaml_file]

    def _is_api_reference(self, route: str) -> bool:
        """Check if a route is an API reference page (not an overview)."""
        if not (route.startswith("/api/client-api/") or route.startswith("/api/indexing-api/")):
            return False
        slug = route.rstrip("/").split("/")[-1]
        return "overview" not in slug

    def _route_to_api_group(self, route: str) -> str:
        """Extract API group from route: /api/client-api/activity/feedback -> client-api/activity"""
        parts = route.strip("/").split("/")
        if len(parts) >= 3:
            return f"{parts[1]}/{parts[2]}"
        return ""

    def _route_to_endpoint_slug(self, route: str) -> str:
        """Extract endpoint slug from route: /api/client-api/activity/feedback -> feedback"""
        parts = route.strip("/").split("/")
        return parts[-1] if parts else ""

    def _load_schema_file(self, api_group: str, slug: str, suffix: str) -> Optional[str]:
        """Load a schema JSON file and return its content as formatted text."""
        path = self.api_docs_dir / api_group / f"{slug}.{suffix}.json"
        if not path.exists():
            return None
        try:
            data = json.loads(path.read_text())
            return json.dumps(data, indent=2)
        except (json.JSONDecodeError, OSError):
            return None

    def _load_request_schema(self, api_group: str, slug: str) -> str:
        """Load and format the request schema for an endpoint."""
        path = self.api_docs_dir / api_group / f"{slug}.RequestSchema.json"
        if not path.exists():
            return ""
        try:
            data = json.loads(path.read_text())
            body = data.get("body", {})
            content = body.get("content", {})
            for content_type, spec in content.items():
                schema = spec.get("schema", {})
                if schema:
                    return json.dumps(schema, indent=2)
            return ""
        except (json.JSONDecodeError, OSError):
            return ""

    def _load_status_codes(self, api_group: str, slug: str) -> tuple[List[str], str]:
        """Load response status codes and the success response body schema.

        Returns (status_codes, response_body_json).
        """
        path = self.api_docs_dir / api_group / f"{slug}.StatusCodes.json"
        if not path.exists():
            return [], ""
        try:
            data = json.loads(path.read_text())
            responses = data.get("responses", {})
            codes = [f"{code}: {info.get('description', '')}" for code, info in responses.items()]

            response_body = ""
            success = responses.get("200", responses.get("201", {}))
            if isinstance(success, dict):
                content = success.get("content", {})
                for content_type, spec in content.items():
                    schema = spec.get("schema", {})
                    if schema:
                        response_body = json.dumps(schema, indent=2)
                        break

            return codes, response_body
        except (json.JSONDecodeError, OSError):
            return [], ""

    def _load_params(self, api_group: str, slug: str) -> tuple[str, str]:
        """Load query and path parameters. Returns (query_params, path_params) as JSON strings."""
        path = self.api_docs_dir / api_group / f"{slug}.ParamsDetails.json"
        if not path.exists():
            return "", ""
        try:
            data = json.loads(path.read_text())
            params = data.get("parameters", [])
            query = {p["name"]: p for p in params if p.get("in") == "query"}
            path_params = {p["name"]: p for p in params if p.get("in") == "path"}
            return (
                json.dumps(query, indent=2) if query else "",
                json.dumps(path_params, indent=2) if path_params else "",
            )
        except (json.JSONDecodeError, OSError):
            return "", ""

    def _find_code_samples(self, route: str) -> dict[str, str]:
        """Find code samples for an endpoint from the OpenAPI specs."""
        samples = {
            "python": "",
            "go": "",
            "java": "",
            "typescript": "",
            "curl": "",
        }

        slug = self._route_to_endpoint_slug(route)
        split_info = self._load_split_info()

        # Find the tag and YAML file for this endpoint
        for tag in split_info.get("tags", []):
            for endpoint in tag.get("endpoints", []):
                if endpoint.get("operationId") == slug:
                    yaml_file = tag.get("file")
                    if not yaml_file:
                        continue

                    spec = self._load_openapi_spec(yaml_file)
                    ep_path = endpoint.get("path", "")
                    ep_method = endpoint.get("method", "").lower()

                    path_ops = spec.get("paths", {}).get(ep_path, {})
                    op = path_ops.get(ep_method, {})
                    code_samples = op.get("x-codeSamples", [])

                    for cs in code_samples:
                        lang = cs.get("lang", "").lower()
                        source = cs.get("source", "")
                        if lang == "python":
                            samples["python"] = source
                        elif lang == "go":
                            samples["go"] = source
                        elif lang == "java":
                            samples["java"] = source
                        elif lang in ("javascript", "typescript"):
                            samples["typescript"] = source

                    return samples

        # Check indexing API spec for indexing endpoints
        if "/indexing-api/" in route:
            if self.indexing_openapi_path.exists():
                spec = yaml.safe_load(self.indexing_openapi_path.read_text())
                for ep_path, methods in spec.get("paths", {}).items():
                    for method, op in methods.items():
                        if isinstance(op, dict) and op.get("operationId") == slug:
                            for cs in op.get("x-codeSamples", []):
                                lang = cs.get("lang", "").lower()
                                source = cs.get("source", "")
                                if lang == "python":
                                    samples["python"] = source
                                elif lang == "go":
                                    samples["go"] = source
                                elif lang == "java":
                                    samples["java"] = source
                                elif lang in ("javascript", "typescript"):
                                    samples["typescript"] = source
                            return samples

        return samples

    def _extract_method_and_endpoint(self, markdown: str) -> tuple[str, str]:
        """Extract HTTP method and endpoint path from the markdown content."""
        lines = markdown.split("\n")
        method = ""
        endpoint = ""
        for i, line in enumerate(lines):
            stripped = line.strip()
            if stripped in ("GET", "POST", "PUT", "DELETE", "PATCH"):
                method = stripped
                if i + 1 < len(lines):
                    endpoint = lines[i + 1].strip()
                break
        return method, endpoint

    def _extract_tag_from_route(self, route: str) -> str:
        """Extract API tag from route: /api/client-api/activity/feedback -> activity"""
        parts = route.strip("/").split("/")
        if len(parts) >= 3:
            return parts[2]
        return ""

    def _build_info_page(self, url: str, doc: dict) -> DocumentationPage:
        """Build a DocumentationPage from docs.json entry."""
        return DocumentationPage(
            id=str(uuid.uuid5(uuid.NAMESPACE_URL, url)),
            title=doc.get("title", "Untitled"),
            content=doc.get("markdown", ""),
            url=url,
            page_type="info_page",
        )

    def _build_api_reference(self, url: str, doc: dict) -> ApiReferencePage:
        """Build an ApiReferencePage by combining docs.json with schema files and OpenAPI specs."""
        route = doc.get("route", "")
        api_group = self._route_to_api_group(route)
        slug = self._route_to_endpoint_slug(route)
        markdown = doc.get("markdown", "")

        method, endpoint = self._extract_method_and_endpoint(markdown)
        tag = self._extract_tag_from_route(route)
        description = doc.get("description", "")

        request_body = self._load_request_schema(api_group, slug)
        response_codes, response_body = self._load_status_codes(api_group, slug)
        query_params, path_params = self._load_params(api_group, slug)
        code_samples = self._find_code_samples(route)

        return ApiReferencePage(
            id=str(uuid.uuid5(uuid.NAMESPACE_URL, url)),
            title=doc.get("title", "Untitled"),
            tag=tag,
            endpoint=endpoint,
            method=method,
            description=description,
            request_content_type="application/json",
            request_query_parameters=query_params,
            request_path_parameters=path_params,
            request_body=request_body,
            response_content_type="application/json",
            response_body=response_body,
            response_codes=response_codes,
            authentication="",
            python_code_sample=code_samples.get("python", ""),
            go_code_sample=code_samples.get("go", ""),
            java_code_sample=code_samples.get("java", ""),
            typescript_code_sample=code_samples.get("typescript", ""),
            curl_code_sample=code_samples.get("curl", ""),
            url=url,
            page_type="api_reference",
        )

    def get_source_data(
        self, since: Optional[str] = None
    ) -> List[Union[DocumentationPage, ApiReferencePage]]:
        """Read all documentation pages from the build output."""
        if not self.docs_json_path.exists():
            raise RuntimeError(
                f"docs.json not found at {self.docs_json_path}. "
                "Run 'pnpm build' first to generate the build output."
            )

        docs = json.loads(self.docs_json_path.read_text())
        self._log(f"  Loaded {len(docs)} pages from {self.docs_json_path}")

        pages: List[Union[DocumentationPage, ApiReferencePage]] = []
        info_count = 0
        api_count = 0

        for url, doc in docs.items():
            route = doc.get("route", "")
            if self._is_api_reference(route):
                page = self._build_api_reference(url, doc)
                api_count += 1
                if self.indexing_logger:
                    self.indexing_logger.log_document(
                        url=url,
                        doc_type="api_reference",
                        title=page["title"],
                        content_length=len(page.get("request_body", "")),
                        status="success",
                        duration_ms=0,
                        tag=page["tag"],
                        method=page["method"],
                        endpoint=page["endpoint"],
                    )
            else:
                page = self._build_info_page(url, doc)
                info_count += 1
                if self.indexing_logger:
                    self.indexing_logger.log_document(
                        url=url,
                        doc_type="info_page",
                        title=page["title"],
                        content_length=len(page["content"]),
                        status="success",
                        duration_ms=0,
                    )
            pages.append(page)

        self._log(f"  Processed {info_count} info pages and {api_count} API reference pages")
        return pages
