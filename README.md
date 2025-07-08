# Glean Developer Site

The official developer documentation site for Glean. This site provides comprehensive documentation for Glean's APIs, SDKs, and developer tools.

## What's Inside

This documentation site includes:

- **API Reference**: Complete documentation for Glean's Client API and Indexing API
- **Getting Started Guides**: Step-by-step tutorials for new developers
- **API Client Documentation**: Libraries for Python, Java, Go, and TypeScript
- **Integration Guides**: Examples for popular frameworks and platforms
- **MCP (Model Context Protocol)**: Documentation for Glean's MCP implementation
- **Changelog**: Release notes and updates

## Prerequisites

This project uses [mise](https://mise.jdx.dev/) to manage tool versions. Install mise first, then run:

```bash
mise install
```

This will automatically install the correct versions of Node.js and Yarn as specified in `mise.toml`.

## Installation

Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd glean-developer-site
yarn install
```

## Development

Start the development server:

```bash
yarn start
```

This command starts a local development server and opens your browser to `http://127.0.0.1:8888`. Most changes are reflected live without having to restart the server.

### Available Scripts

- `yarn start` - Start development server
- `yarn build` - Build the site for production
- `yarn serve` - Serve the built site locally
- `yarn clear` - Clear Docusaurus cache

## Project Structure

```tree
├── docs/                    # Documentation content
│   ├── api/                # API reference documentation
│   ├── api-info/           # API authentication and setup guides
│   ├── get-started/        # Getting started guides
│   ├── guides/             # Feature guides and tutorials
│   └── libraries/          # SDK and library documentation
├── src/                    # React components and utilities
│   ├── components/         # Custom React components
│   ├── theme/              # Docusaurus theme customizations
│   └── utils/              # Utility functions
├── static/                 # Static assets
├── changelog/              # Changelog entries
├── openapi/                # OpenAPI specifications
└── scripts/                # Build and utility scripts
```

## Content Management

### Changelog Management

Use the yarn command to create new changelog entries:

```bash
yarn changelog:new
```

### OpenAPI Integration

The site automatically generates API documentation from OpenAPI specifications located in the `openapi/` directory.

## 🧪 Testing

Run the build command to test for any issues:

```bash
yarn build
```

This will catch any broken links, missing imports, or other build-time errors.

## License

This project is licensed under the same terms as the Glean platform.

## Support

For questions about the documentation or to report issues:

- Create an issue in this repository
- Check the [Glean Help Center](https://docs.glean.com/)
