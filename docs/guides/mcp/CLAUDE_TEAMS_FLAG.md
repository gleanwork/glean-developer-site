# Claude Teams/Enterprise Feature Flag

## Overview

Claude Teams/Enterprise support in the MCP configurator is controlled by the `show-claude-teams` feature flag.

## Current Status

- **Flag Name**: `show-claude-teams`
- **Default**: `false` (disabled)
- **Affects**: 
  - MCPConfigurator component (host selector dropdown)
  - Host Compatibility table in documentation

## Enabling the Flag

### For Local Development

Add to your `.env` file:
```bash
FF_SHOW_CLAUDE_TEAMS=true
```

Or use the JSON format:
```bash
FEATURE_FLAGS_JSON='{"show-claude-teams":{"enabled":true}}'
```

### For Production (Vercel)

Update the Edge Config with:
```json
{
  "feature-flags": {
    "show-claude-teams": {
      "enabled": true
    }
  }
}
```

### For Gradual Rollout

Test with specific users first:
```json
{
  "show-claude-teams": {
    "enabled": true,
    "allowedUsers": ["team@glean.com"]
  }
}
```

Or use percentage rollout:
```json
{
  "show-claude-teams": {
    "enabled": true,
    "rolloutPercentage": 25
  }
}
```

## Components Affected

1. **MCPConfigurator** (`src/components/MCPConfigurator/index.tsx`)
   - Filters Claude Teams/Enterprise from the client dropdown
   - Hides authentication options (centrally managed)

2. **CompatibilityTable** (`docs/guides/mcp/RemoteMCPContent.mdx`)
   - Filters Claude Teams/Enterprise from the host compatibility table

## Notes

- Claude Teams/Enterprise requires administrator setup
- Authentication is centrally managed (no local OAuth/Bearer token configuration)
- When enabled, users will see "Claude for Teams/Enterprise" in the host selector
