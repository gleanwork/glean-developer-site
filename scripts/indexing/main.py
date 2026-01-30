#!/usr/bin/env python3

import os
import sys
from pathlib import Path

from dotenv import load_dotenv

# Load .env file if present (for local development)
env_path = Path(__file__).parent / ".env"
if env_path.exists():
    load_dotenv(env_path)

from data_clients import DeveloperDocsDataClient
from developer_docs_connector import CustomDeveloperDocsConnector
from glean.indexing.models import IndexingMode
from indexing_logger import create_logger


def main():
    dry_run = os.getenv("DRY_RUN", "").lower() in ("true", "1", "yes")
    log_format = os.getenv("LOG_FORMAT", "stdout")
    indexing_logger = create_logger(format=log_format, verbose=True)

    try:
        if dry_run:
            indexing_logger.start("Dry run mode: fetching and transforming data")
        else:
            indexing_logger.start("Starting indexing operation")

        developer_docs_data_client = DeveloperDocsDataClient(
            "https://developers.glean.com",
            indexing_logger=indexing_logger
        )
        connector = CustomDeveloperDocsConnector(name="devdocs", data_client=developer_docs_data_client)

        if dry_run:
            # Fetch source data
            data = connector.get_data()
            indexing_logger.log("")
            indexing_logger.log(f"Fetched {len(data)} pages total")

            # Transform to document definitions
            documents = connector.transform(data)
            indexing_logger.log(f"Transformed {len(documents)} documents")

            # Generate and print summary
            summary = indexing_logger.finish()

            if summary.failed > 0:
                indexing_logger.log("")
                indexing_logger.log("Dry run complete with errors. No data was uploaded to Glean.")
                sys.exit(1)
            else:
                indexing_logger.log("Dry run complete. No data was uploaded to Glean.")
        else:
            connector.configure_datasource()
            connector.index_data(mode=IndexingMode.FULL, force_restart=True)

            # Generate summary
            summary = indexing_logger.finish()

            if summary.failed > 0:
                indexing_logger.log("Indexing completed with errors!")
                sys.exit(1)
            else:
                indexing_logger.log("Indexing completed successfully!")

    except Exception as e:
        indexing_logger.log_error(f"Error occurred during indexing: {e}")
        raise


if __name__ == "__main__":
    main()
