"""Pytest fixtures for indexing-script tests.

The fixtures build a self-contained fake repo on disk under tmp_path with the
specific files the data client expects:

    <repo>/build/mcp/docs.json
    <repo>/build/indexing/timestamps.json
    <repo>/docs/api/client-api/<group>/<slug>.{RequestSchema,StatusCodes,ParamsDetails}.json
    <repo>/docs/api/indexing-api/<slug>.{RequestSchema,StatusCodes,ParamsDetails}.json

This lets us exercise the real file-loading paths without depending on a
checked-out build/ tree or the actual API specs.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

import pytest

# Make the indexing scripts importable as plain modules.
INDEXING_DIR = Path(__file__).parent.parent
if str(INDEXING_DIR) not in sys.path:
    sys.path.insert(0, str(INDEXING_DIR))


def _write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2))


# Sample JSON-Schema fragments used across tests. Kept tiny but exercising
# enough shape for _simplify_schema to do something interesting.
SIMPLE_REQUEST_SCHEMA = {
    "title": "FeedbackRequest",
    "body": {
        "content": {
            "application/json": {
                "schema": {
                    "type": "object",
                    "required": ["event"],
                    "properties": {
                        "event": {
                            "type": "string",
                            "description": "What happened.",
                            "enum": ["CLICK", "VIEW"],
                        },
                        "trackingTokens": {
                            "type": "array",
                            "description": "Server-generated tokens.",
                            "items": {"type": "string"},
                        },
                    },
                }
            }
        }
    },
}

ALLOF_REQUEST_SCHEMA = {
    "title": "DatasourceConfig",
    "body": {
        "content": {
            "application/json": {
                "schema": {
                    "description": "Datasource config.",
                    "allOf": [
                        {
                            "type": "object",
                            "required": ["name"],
                            "properties": {
                                "name": {"type": "string", "description": "Datasource name."},
                                "displayName": {"type": "string", "description": "Display name."},
                            },
                        }
                    ],
                }
            }
        }
    },
}

STATUS_CODES = {
    "responses": {
        "200": {
            "description": "OK",
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "id": {"type": "string", "description": "Document id."}
                        },
                    }
                }
            },
        },
        "400": {"description": "Bad Request"},
        "401": {"description": "Not Authorized"},
    }
}

PARAMS_DETAILS = {
    "parameters": [
        {
            "name": "feedback",
            "in": "query",
            "description": "URL-encoded feedback.",
            "required": False,
            "schema": {"type": "string"},
        },
        {
            "name": "datasourceId",
            "in": "path",
            "description": "Datasource id.",
            "required": True,
            "schema": {"type": "string"},
        },
    ]
}


def _build_repo(tmp_path: Path) -> Path:
    """Materialize a minimal fake repo on disk."""
    api = tmp_path / "docs" / "api"

    # client-api endpoint: /api/client-api/activity/feedback
    _write_json(api / "client-api" / "activity" / "feedback.RequestSchema.json", SIMPLE_REQUEST_SCHEMA)
    _write_json(api / "client-api" / "activity" / "feedback.StatusCodes.json", STATUS_CODES)
    _write_json(api / "client-api" / "activity" / "feedback.ParamsDetails.json", PARAMS_DETAILS)

    # indexing-api endpoint (flat): /api/indexing-api/add-or-update-datasource
    _write_json(api / "indexing-api" / "add-or-update-datasource.RequestSchema.json", ALLOF_REQUEST_SCHEMA)
    _write_json(api / "indexing-api" / "add-or-update-datasource.StatusCodes.json", STATUS_CODES)

    # docs.json — three pages: one info, one nested API ref, one flat API ref
    docs_json = {
        "https://developers.glean.com/guides/getting-started": {
            "title": "Getting Started",
            "description": "Welcome to Glean.",
            "route": "/guides/getting-started",
            "markdown": "# Getting Started\n\nWelcome.",
        },
        "https://developers.glean.com/api/client-api/activity/feedback": {
            "title": "Report client activity",
            "description": "Report events.",
            "route": "/api/client-api/activity/feedback",
            "markdown": "# Report client activity\n\nPOST\n/rest/api/v1/feedback\n\nDescription.",
        },
        "https://developers.glean.com/api/indexing-api/add-or-update-datasource": {
            "title": "Add or update datasource",
            "description": "Add or update.",
            "route": "/api/indexing-api/add-or-update-datasource",
            "markdown": "# Add or update datasource\n\nPOST\n/api/index/v1/adddatasource\n\nDescription.",
        },
        # An overview page that should be classified as an info page, not API
        "https://developers.glean.com/api/client-api/search/overview": {
            "title": "Search Overview",
            "description": "Overview.",
            "route": "/api/client-api/search/overview",
            "markdown": "# Search Overview",
        },
    }
    _write_json(tmp_path / "build" / "mcp" / "docs.json", docs_json)

    # timestamps.json — covers two of the three pages; the indexing-api page is
    # intentionally omitted to test the missing-key path.
    timestamps = {
        "https://developers.glean.com/guides/getting-started": {
            "createdAt": 1700000000,
            "lastUpdate": 1735689600,
        },
        "https://developers.glean.com/api/client-api/activity/feedback": {
            "createdAt": 1700000001,
            "lastUpdate": 1735689601,
        },
    }
    _write_json(tmp_path / "build" / "indexing" / "timestamps.json", timestamps)

    return tmp_path


@pytest.fixture
def fake_repo(tmp_path: Path) -> Path:
    """Path to a freshly-built fake repo for one test."""
    return _build_repo(tmp_path)


@pytest.fixture
def empty_repo(tmp_path: Path) -> Path:
    """A repo with no build/ output — for testing missing-file fallbacks."""
    return tmp_path
