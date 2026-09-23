"""Data client that reads documentation content from Docusaurus build output.

Reads from:
- build/mcp/docs.json — full markdown for all pages
- docs/api/**/*.RequestSchema.json — request schemas
- docs/api/**/*.StatusCodes.json — response codes
- docs/api/**/*.ParamsDetails.json — query/path parameters
"""

from dataclasses import dataclass
from typing import Any, Union, List, Optional
from pathlib import Path, PurePosixPath
import os
import uuid
import json
import logging

from glean.indexing.connectors import BaseDataClient

from data_types import DocumentationPage, ApiReferencePage

# Under the "glean" namespace so the SDK logging setup (glean-idx run
# --log-level, setup_connector_logging) routes and levels these lines too.
logger = logging.getLogger("glean.devdocs.data_client")


@dataclass(frozen=True)
class ApiRoute:
    """Parsed representation of a /api/* route.

    Two route shapes:
      - Nested (client-api): /api/client-api/<group>/<slug>
      - Flat (indexing-api): /api/indexing-api/<slug>
    """

    api: str            # "client-api" | "indexing-api"
    group: Optional[str]  # tag/group name, or None for flat routes
    slug: str           # endpoint identifier

    @classmethod
    def parse(cls, route: str) -> Optional["ApiRoute"]:
        """Parse a route string. Returns None if the shape isn't recognized."""
        parts = PurePosixPath(route).parts
        # Absolute path: parts[0] == "/", parts[1] should be "api"
        if len(parts) < 4 or parts[0] != "/" or parts[1] != "api":
            return None
        if len(parts) == 4:
            return cls(api=parts[2], group=None, slug=parts[3])
        if len(parts) == 5:
            return cls(api=parts[2], group=parts[3], slug=parts[4])
        return None

    @property
    def schema_dir(self) -> str:
        """Relative directory under docs/api/ that holds this endpoint's schema files."""
        return f"{self.api}/{self.group}" if self.group else self.api

    @property
    def is_overview(self) -> bool:
        return "overview" in self.slug


class DeveloperDocsDataClient(BaseDataClient[Union[DocumentationPage, ApiReferencePage]]):
    """Reads documentation content from Docusaurus build output files.

    The repo root defaults to this file's location; set DEVDOCS_REPO_ROOT to
    read a build from elsewhere.
    """

    MAX_SCHEMA_CHARS = 20_000

    def __init__(self, repo_root: Optional[str] = None):
        if repo_root is None:
            repo_root = os.getenv("DEVDOCS_REPO_ROOT") or str(Path(__file__).parent.parent.parent)
        self.repo_root = Path(repo_root)

        self.docs_json_path = self.repo_root / "build" / "mcp" / "docs.json"
        self.timestamps_path = self.repo_root / "build" / "indexing" / "timestamps.json"
        self.api_docs_dir = self.repo_root / "docs" / "api"
        self._timestamps: Optional[dict[str, dict]] = None
        # Pages found by the last get_source_data() call, before any caller
        # truncates the result (e.g. `glean-idx test --max-items`).
        self.last_fetch_count: Optional[int] = None

    def _load_timestamps(self) -> dict[str, dict]:
        """Load timestamps map produced by the doc-timestamps Docusaurus plugin.

        Returns an empty dict if the file is missing — connector then emits None
        for created_at/updated_at and the SDK omits the fields from the upload.
        """
        if self._timestamps is not None:
            return self._timestamps
        if not self.timestamps_path.exists():
            logger.warning(
                "No timestamps file at %s; documents will be indexed without "
                "created_at/updated_at",
                self.timestamps_path,
            )
            self._timestamps = {}
            return self._timestamps
        try:
            self._timestamps = json.loads(self.timestamps_path.read_text())
            logger.info(
                "Loaded %d timestamp entries from %s", len(self._timestamps), self.timestamps_path
            )
        except (json.JSONDecodeError, OSError) as e:
            logger.warning("Failed to load timestamps file: %s; continuing without", e)
            self._timestamps = {}
        return self._timestamps

    def _is_api_reference(self, route: str) -> bool:
        """Check if a route is an API reference page (not an overview)."""
        parsed = ApiRoute.parse(route)
        return parsed is not None and not parsed.is_overview

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

    def _load_request_schema(self, route: ApiRoute) -> str:
        """Load and format the request schema for an endpoint."""
        path = self.api_docs_dir / route.schema_dir / f"{route.slug}.RequestSchema.json"
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

    def _load_status_codes(self, route: ApiRoute) -> tuple[List[str], str]:
        """Load response status codes and the success response body schema."""
        path = self.api_docs_dir / route.schema_dir / f"{route.slug}.StatusCodes.json"
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

    def _load_params(self, route: ApiRoute) -> tuple[str, str]:
        """Load query and path parameters. Returns (query_params, path_params) as JSON strings."""
        path = self.api_docs_dir / route.schema_dir / f"{route.slug}.ParamsDetails.json"
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

    def _build_info_page(self, url: str, doc: dict) -> DocumentationPage:
        """Build a DocumentationPage from docs.json entry."""
        ts = self._load_timestamps().get(url, {})
        return DocumentationPage(
            id=str(uuid.uuid5(uuid.NAMESPACE_URL, url)),
            title=doc.get("title", "Untitled"),
            content=doc.get("markdown", ""),
            url=url,
            page_type="info_page",
            created_at=ts.get("createdAt"),
            updated_at=ts.get("lastUpdate"),
        )

    def _build_api_reference(self, url: str, doc: dict) -> ApiReferencePage:
        """Build an ApiReferencePage by combining docs.json with schema files."""
        ts = self._load_timestamps().get(url, {})
        route = ApiRoute.parse(doc.get("route", ""))
        if route is None:
            raise ValueError(f"_build_api_reference called with non-API route: {doc.get('route')!r}")
        markdown = doc.get("markdown", "")

        method, endpoint = self._extract_method_and_endpoint(markdown)
        description = doc.get("description", "")

        request_body = self._load_request_schema(route)
        response_codes, response_body = self._load_status_codes(route)
        query_params, path_params = self._load_params(route)

        return ApiReferencePage(
            id=str(uuid.uuid5(uuid.NAMESPACE_URL, url)),
            title=doc.get("title", "Untitled"),
            tag=route.group or "",
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
            url=url,
            page_type="api_reference",
            created_at=ts.get("createdAt"),
            updated_at=ts.get("lastUpdate"),
        )

    def get_source_data(
        self, since: Optional[str] = None, **kwargs: Any
    ) -> List[Union[DocumentationPage, ApiReferencePage]]:
        """Read all documentation pages from the build output.

        Always returns the whole site: the build output has no change feed, so
        ``since`` is accepted for interface compatibility and ignored.
        """
        if not self.docs_json_path.exists():
            raise RuntimeError(
                f"docs.json not found at {self.docs_json_path}. "
                "Run 'pnpm build' first to generate the build output."
            )

        docs = json.loads(self.docs_json_path.read_text())
        logger.info("Loaded %d pages from %s", len(docs), self.docs_json_path)

        pages: List[Union[DocumentationPage, ApiReferencePage]] = []
        info_count = 0
        api_count = 0

        for url, doc in docs.items():
            route = doc.get("route", "")
            if self._is_api_reference(route):
                page = self._build_api_reference(url, doc)
                api_count += 1
                logger.debug("api_reference %s %s %s", page["method"], page["endpoint"], url)
            else:
                page = self._build_info_page(url, doc)
                info_count += 1
                logger.debug("info_page %s", url)
            pages.append(page)

        logger.info("Read %d info pages and %d API reference pages", info_count, api_count)
        self.last_fetch_count = len(pages)
        return pages
