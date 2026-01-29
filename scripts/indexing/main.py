#!/usr/bin/env python3

import os
from pathlib import Path

from dotenv import load_dotenv

# Load .env file if present (for local development)
env_path = Path(__file__).parent / ".env"
if env_path.exists():
    load_dotenv(env_path)

from data_clients import DeveloperDocsDataClient
from developer_docs_connector import CustomDeveloperDocsConnector
from glean.indexing.models import IndexingMode


def print_dry_run_summary(source_data: list, documents: list) -> None:
    """Print a summary of extracted documents for validation."""

    print("\n" + "=" * 80)
    print("DOCUMENT EXTRACTION SUMMARY")
    print("=" * 80 + "\n")

    warnings = []
    info_count = 0
    api_count = 0

    for page in source_data:
        page_type = page.get("page_type", "unknown")
        url = page.get("url", "unknown")
        title = page.get("title", "")

        if page_type == "info_page":
            info_count += 1
            content = page.get("content", "")
            content_len = len(content)

            status = "✓" if title and content_len > 0 else "⚠"
            print(f"{status} [info] {url}")
            print(f"       title: {len(title)} chars | content: {content_len} chars")

            if not title:
                warnings.append(f"Empty title: {url}")
            if content_len == 0:
                warnings.append(f"Empty content: {url}")

        elif page_type == "api_reference":
            api_count += 1
            tag = page.get("tag", "")
            method = page.get("method", "")
            endpoint = page.get("endpoint", "")
            description = page.get("description", "")
            request_body = page.get("request_body", "")
            response_body = page.get("response_body", "")

            has_issue = not title or not tag or not method or not endpoint
            status = "⚠" if has_issue else "✓"

            print(f"{status} [api]  {url}")
            print(f"       title: {len(title)} chars | tag: {tag} | method: {method}")
            print(f"       endpoint: {endpoint}")
            print(f"       description: {len(description)} chars | req_body: {len(request_body)} chars | res_body: {len(response_body)} chars")

            if not title:
                warnings.append(f"Empty title: {url}")
            if not tag or tag == "unknown":
                warnings.append(f"Unknown tag: {url}")
            if not method or method == "unknown":
                warnings.append(f"Unknown method: {url}")
            if not endpoint or endpoint == "unknown":
                warnings.append(f"Unknown endpoint: {url}")
            if not description:
                warnings.append(f"Empty description: {url}")

        print()  # blank line between entries

    # Aggregate summary
    print("=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"Total pages scraped: {len(source_data)}")
    print(f"  - Info pages: {info_count}")
    print(f"  - API reference: {api_count}")
    print(f"Total documents transformed: {len(documents)}")
    print()

    if warnings:
        print(f"WARNINGS ({len(warnings)}):")
        for w in warnings:
            print(f"  ⚠ {w}")
    else:
        print("No warnings - all documents look good!")

    print()


def main():
    dry_run = os.getenv("DRY_RUN", "").lower() in ("true", "1", "yes")

    try:
        developer_docs_data_client = DeveloperDocsDataClient("https://developers.glean.com")
        connector = CustomDeveloperDocsConnector(name="devdocs", data_client=developer_docs_data_client)

        if dry_run:
            print("Dry run mode: fetching and transforming data...\n")

            # Fetch source data
            data = connector.get_data()
            print(f"\nFetched {len(data)} pages")

            # Transform to document definitions
            documents = connector.transform(data)
            print(f"Transformed {len(documents)} documents")

            # Print summary for validation
            print_dry_run_summary(data, documents)

            print("Dry run complete. No data was uploaded to Glean.")
        else:
            connector.configure_datasource(is_test=True)
            connector.index_data(mode=IndexingMode.FULL)
            print("Indexing completed successfully!")

    except Exception as e:
        print(f"Error occurred during indexing: {e}")
        raise


if __name__ == "__main__":
    main()
