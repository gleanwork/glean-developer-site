# Changelog Management Guide

This guide explains how to create and manage changelog entries for the Glean Developer site.

## Quick Start (Recommended)

The easiest way to create a new changelog entry is using our interactive generator:

```bash
pnpm changelog:new
```

This will guide you through creating a properly formatted entry with the correct filename, frontmatter, and structure.

## Manual Creation

If you prefer to create entries manually, follow the structure below.

### Directory Structure

All changelog entries are stored in the `changelog/entries/` directory as Markdown files.

### File Naming Convention

Use the following naming pattern for changelog files:

```YYYY-MM-DD-descriptive-slug.md```

**Examples:**

- `2025-06-27-oauth-remote-mcp.md`
- `2025-05-31-api-reference-updates.md`
- `2025-04-15-new-governance-endpoints.md`

### File Format

Each changelog entry should follow this structure:

```markdown
---
title: "Your Entry Title"
tags: ["Client API", "Feature"] # Required: array of tags
---

Brief description of the change that appears on the main changelog page.

{/* truncate */}

## Additional Details

More detailed information that only appears on the individual entry page.

### Subsections

You can include:
- Code examples
- Links to documentation
- Breaking changes
- Migration guides
```

## Available Tags

### Primary Component Tags

Choose **one** primary component that this change affects:

- **Client API** - REST API for search, chat, etc.
- **Indexing API** - REST API for document indexing  
- **API Clients** - Official SDKs for various languages
- **Glean Agent Toolkit** - Tools for building AI agents
- **Glean Indexing SDK** - SDK for custom indexing solutions
- **langchain-glean** - LangChain integration package
- **MCP** - Model Context Protocol server

### Change Type Tags (Optional)

Add **one or more** change type tags as needed:

- **Feature** - New functionality
- **Enhancement** - Improvements to existing features
- **Bug Fix** - Fixes and corrections
- **Breaking** - Breaking changes requiring migration
- **Security** - Security-related updates
- **Deprecation** - Deprecated features or endpoints
- **Documentation** - Documentation updates

### Category Mapping

Tags are automatically mapped to semantic categories for filtering:

- **API** ← Client API, Indexing API
- **SDK** ← API Clients, Glean Agent Toolkit, Glean Indexing SDK, langchain-glean, MCP
- **Feature/Enhancement/Bug Fix/etc.** ← Change type tags

## Truncation

Use one of the following markers to separate content:

- `{/* truncate */}` (recommended for MDX compatibility)
- `<!-- truncate -->`
- `<!-- more -->`

Content **before** the marker appears on the main changelog page, while content **after** the marker only appears on individual entry pages.

If no truncate marker exists, the system will automatically truncate content using these fallback rules:

1. First paragraph only (if multiple paragraphs exist)
2. First 200 characters with word boundary truncation (if content is very long)

## Build Integration

The changelog system is integrated into the build process:

1. **Development**: Run `pnpm changelog:aggregate` to process entries
2. **Production**: The `pnpm build` command automatically generates changelog data
3. **Hot Reloading**: Changes to entries are reflected immediately during development

## Available Scripts

- `pnpm changelog:new` - Create a new changelog entry interactively
- `pnpm changelog:aggregate` - Process existing entries into JSON data
- `pnpm build` - Build the site (includes changelog generation)
- `pnpm start` - Start development server

## Best Practices

1. **Use the generator** - `pnpm changelog:new` ensures proper formatting
2. **Keep summaries concise** - The pre-truncate content should be 1-3 sentences
3. **Choose appropriate tags** - Focus on the primary component affected
4. **Include relevant links** - Link to documentation, GitHub issues, or related resources
5. **Write for developers** - Assume your audience is technical

## Examples

See the existing entries in `changelog/entries/` for examples of well-formatted changelog entries.

## Publishing

Once you create a new changelog entry (either via generator or manually) and run the build command, it will automatically appear on the changelog page with proper categorization and timeline formatting.
