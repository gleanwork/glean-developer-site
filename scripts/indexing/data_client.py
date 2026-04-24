"""Data client that reads documentation content from Docusaurus build output.

Instead of scraping the live site with Playwright, this reads from:
- build/mcp/docs.json — full markdown for all pages
- docs/api/**/*.RequestSchema.json — request schemas
- docs/api/**/*.StatusCodes.json — response codes
- docs/api/**/*.ParamsDetails.json — query/path parameters
"""

from typing import Union, List, Optional, TYPE_CHECKING
from pathlib import Path
import uuid
import json
import logging

from data_types import DocumentationPage, ApiReferencePage

if TYPE_CHECKING:
    from indexing_logger import IndexingLogger

logger = logging.getLogger(__name__)


class DeveloperDocsDataClient:
    """Reads documentation content from Docusaurus build output files."""

    MAX_SCHEMA_CHARS = 20_000

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

    def _log(self, msg: str) -> None:
        if self.indexing_logger:
            self.indexing_logger.log(msg)

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

    def _simplify_schema(self, schema: dict, max_depth: int = 2, depth: int = 0) -> dict:
        """Simplify a JSON schema by limiting nesting depth."""
        if depth >= max_depth:
            return {"type": schema.get("type", "object"), "description": schema.get("description", "...")}

        result = {}
        for key in ("type", "description", "required", "enum"):
            if key in schema:
                result[key] = schema[key]

        if "properties" in schema:
            result["properties"] = {
                name: self._simplify_schema(prop, max_depth, depth + 1)
                for name, prop in schema["properties"].items()
            }

        if "items" in schema and isinstance(schema["items"], dict):
            result["items"] = self._simplify_schema(schema["items"], max_depth, depth + 1)

        if "allOf" in schema:
            merged = {}
            for sub in schema["allOf"]:
                if isinstance(sub, dict):
                    simplified = self._simplify_schema(sub, max_depth, depth)
                    merged.update(simplified)
            return merged

        return result

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
                    simplified = self._simplify_schema(schema)
                    text = json.dumps(simplified, indent=2)
                    if len(text) > self.MAX_SCHEMA_CHARS:
                        text = text[:self.MAX_SCHEMA_CHARS] + "\n... (truncated)"
                    return text
            return ""
        except (json.JSONDecodeError, OSError):
            return ""

    def _load_status_codes(self, api_group: str, slug: str) -> tuple[List[str], str]:
        """Load response status codes and the success response body schema."""
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
                        simplified = self._simplify_schema(schema)
                        text = json.dumps(simplified, indent=2)
                        if len(text) > self.MAX_SCHEMA_CHARS:
                            text = text[:self.MAX_SCHEMA_CHARS] + "\n... (truncated)"
                        response_body = text
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
            created_at=doc.get("createdAt"),
            updated_at=doc.get("lastUpdate"),
        )

    def _build_api_reference(self, url: str, doc: dict) -> ApiReferencePage:
        """Build an ApiReferencePage by combining docs.json with schema files."""
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
            python_code_sample="",
            go_code_sample="",
            java_code_sample="",
            typescript_code_sample="",
            curl_code_sample="",
            url=url,
            page_type="api_reference",
            created_at=doc.get("createdAt"),
            updated_at=doc.get("lastUpdate"),
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
