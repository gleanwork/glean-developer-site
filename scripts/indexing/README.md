# Glean Developer Docs Indexing

This directory contains scripts for indexing Glean developer documentation into a Glean instance for enhanced search capabilities.

## Overview

The indexing system crawls the Glean developer documentation website and extracts content for indexing. It handles two types of content:

- **Documentation Pages**: General information pages with sections and headings
- **API Reference Pages**: API endpoint documentation with detailed schema information

## Setup

### Prerequisites

- [mise](https://mise.jdx.dev/) - Tool version manager (manages Python and uv versions)

The repository uses `mise.toml` in the root to manage tool versions:

- Python 3.13.0
- uv 0.7

### Installation

1. From the repository root, ensure tools are installed:

   ```bash
   mise install
   ```

2. Navigate to the indexing directory:

   ```bash
   cd scripts/indexing
   ```

3. Install dependencies using uv:

   ```bash
   uv sync
   ```

4. Install Playwright browsers:

   ```bash
   uv run playwright install
   ```

## Usage

### Local Development

Run the indexing script locally:

```bash
# Set required environment variables
export GLEAN_INDEXING_API_TOKEN="your-api-token"
export GLEAN_INSTANCE="your-glean-instance"

# Run the script
uv run main.py
```

### Environment Variables

- `GLEAN_INDEXING_API_TOKEN` - API token for Glean indexing
- `GLEAN_INSTANCE` - Your Glean instance URL

### GitHub Actions

The indexing runs automatically via GitHub Actions:

- **Schedule**: Daily at 2 AM UTC
- **Manual**: Can be triggered manually via workflow dispatch
- **Workflow**: `.github/workflows/index-developer-docs.yml`
