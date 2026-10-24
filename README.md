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

This will automatically install the correct versions of Node.js and pnpm as specified in `mise.toml`.

## Installation

Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd glean-developer-site
pnpm install
```

## Development

Start the development server:

```bash
pnpm start
```

This command starts a local development server and opens your browser to `http://127.0.0.1:8888`. Most changes are reflected live without having to restart the server.

### Available Scripts

- `pnpm start` - Start development server
- `pnpm build` - Build the site for production
- `pnpm serve` - Serve the built site locally
- `pnpm clear` - Clear Docusaurus cache

### Link Checking

The project includes automated link checking to ensure all documentation links are valid:

**Check production site:**
```bash
pnpm links:check
```

**Check local build:**
```bash
# Automatically builds, serves on port 8888, and checks links
pnpm links:check:local
```

This command automatically builds the site, starts a server on port 8888, runs the link checker, and cleans up when done.

**Note:** Link checking requires `lychee`. Install it with:
```bash
brew install lychee  # macOS
# or see https://github.com/lycheeverse/lychee for other platforms
```

The link checker validates all links in the site by:
- Fetching the sitemap.xml (only available in production builds)
- Crawling each page to find and validate all links
- Excluding known problematic URLs (auth-required sites, placeholders, etc.)

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

Use the pnpm command to create new changelog entries:

```bash
pnpm changelog:new
```

### OpenAPI Integration

The site automatically generates API documentation from OpenAPI specifications located in the `openapi/` directory.

## Environment Variables

The build optionally includes a Google verification meta tag. Set the
`GOOGLE_SITE_VERIFICATION` environment variable with your verification token if
you want this tag injected at build time:

```bash
export GOOGLE_SITE_VERIFICATION=your-token
pnpm build
```

If the variable is not set, the tag is omitted.

## Analytics

The site uses [Vercel Web Analytics](https://vercel.com/docs/analytics). `src/clientModules/vercelAnalytics.ts` loads it in production builds, and removes query strings and the OAuth callback page from every event before it's sent.

Custom events go through `trackEvent` in [`src/lib/analytics.ts`](src/lib/analytics.ts). The `AnalyticsEvents` type in that file lists every event the site sends, so it's the full record of what we collect.

### Add an event

1. Add the event to `AnalyticsEvents`, with a comment that names the question it answers.
2. Follow the rules in the header of `src/lib/analytics.ts`: at most two properties, because Vercel keeps only two per event, and values from a fixed set. Never send emails, tenant or instance URLs, tokens, search queries, or other free text.
3. Call `trackEvent('your_event', { ... })` where the interaction happens. TypeScript rejects an event name or property that isn't in the type.
4. Add a test that mocks `@site/src/lib/analytics` and checks the call, like `src/components/home/homeAnalytics.test.tsx`.

### Check an event

- **Locally:** with `pnpm start`, `trackEvent` logs each event to the browser console as `[analytics] <name> <properties>` and sends nothing. The log uses `console.debug`, so turn on the console's Verbose level to see it.
- **On a preview deployment:** preview builds are production builds, so they send events. In the browser's Network panel, the event is a request to `/_vercel/insights/event`.
- **In Vercel:** events appear in the Events panel of the project's Analytics tab.

## 🧪 Testing

Run the build command to test for any issues:

```bash
pnpm build
```

This will catch any broken links, missing imports, or other build-time errors.

## License

This project is licensed under the same terms as the Glean platform.

## Support

For questions about the documentation or to report issues:

- Create an issue in this repository
- Check the [Glean Help Center](https://docs.glean.com/)
