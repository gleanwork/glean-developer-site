#!/usr/bin/env python3

import asyncio
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

# Load .env file if present (for local development)
env_path = Path(__file__).parent / ".env"
if env_path.exists():
    load_dotenv(env_path)

from data_clients import DeveloperDocsDataClient
from developer_docs_connector import DeveloperDocsConnector
from glean.indexing.models import IndexingMode
from indexing_logger import create_logger


async def main():
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
        connector = DeveloperDocsConnector(name="devdocs", async_data_client=developer_docs_data_client)

        if dry_run:
            # Fetch source data (async streaming - consume async generator into list for dry run)
            data = []
            async for item in connector.get_data_async():
                data.append(item)
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
            await connector.index_data_async(mode=IndexingMode.FULL)

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
    asyncio.run(main())
