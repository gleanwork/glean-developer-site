# Feature Flags System

This document describes the feature flag system implemented for the Glean Developer Site.

## Quick Setup

### 1. Vercel Edge Config

- Edge Config Name: `glean-developer-feature-flags`
- Add the connection string to your environment as `EDGE_CONFIG`

### 2. Edge Config Structure

```json
{
  "feature-flags": {
    "new-api-docs": {
      "enabled": true,
      "rolloutPercentage": 50
    },
    "beta-tutorials": {
      "enabled": false
    },
    "mcp-cli-version": {
      "enabled": true,
      "metadata": {
        "version": "1.0.0-beta.1"
      },
      "description": "Version to pin the @gleanwork/configure-mcp-server package to"
    }
  }
}
```

## Usage

### Build-Time Flags (for SEO/static content)

#### Option 1: Individual flags

```bash
FF_NEW_API_DOCS=true FF_BETA_TUTORIALS=false pnpm build
```

#### Option 2: JSON config

```bash
FEATURE_FLAGS_JSON='{"new-api-docs":{"enabled":true}}' pnpm build
```

**Hide sidebar sections:**

```typescript
// sidebars.ts
{
  type: 'category',
  label: 'Beta Features',
  customProps: {
    flag: 'beta-features'  // Hidden unless flag is enabled
  },
  items: [...]
}
```

**Hide navbar items:**

```typescript
// docusaurus.config.ts
{
  label: 'Beta',
  href: '/beta',
  flag: 'beta-docs'  // Hidden unless flag is enabled
}
```

### Runtime Flags (for dynamic content)

**In MDX files:**

```jsx
<FeatureFlag flag="new-feature">
  ## This content is gated
  Only shows when flag is enabled.
</FeatureFlag>
```

**In React components:**

```tsx
import { useContext } from 'react';
import { FeatureFlagsContext } from '@site/src/theme/Root';

function Component() {
  const { isEnabled } = useContext(FeatureFlagsContext);
  
  if (isEnabled('new-ui')) {
    return <NewUI />;
  }
  return <OldUI />;
}
```

## Local Development

Create `.env` file:

```bash
# Edge Config (optional locally)
EDGE_CONFIG=ecfg_xxxxx

# Override flags locally
FEATURE_FLAGS_JSON='{"my-flag":{"enabled":true}}'
FF_BETA_DOCS=true

# Enable debug mode
FLAGS_DEBUG=true
```

## Architecture

### Files

- `src/lib/featureFlags.ts` - Core evaluation logic
- `src/lib/featureFlagTypes.ts` - TypeScript types
- `src/theme/Root.tsx` - React Context provider
- `src/components/FeatureFlag.tsx` - MDX component
- `src/utils/buildTimeFlags.ts` - Build-time flag loader
- `src/utils/filtering.ts` - Sidebar/navbar filtering
- `api/feature-flags.js` - Vercel API endpoint

### How It Works

1. **Build Time:**
   - Reads flags from env vars
   - Filters sidebars/navbar
   - Embeds snapshot in build

2. **Runtime:**
   - Hydrates from build snapshot (instant)
   - Fetches from `/api/feature-flags` in background
   - Caches in localStorage (5 min TTL)
   - CDN caches API responses (60s)

## Flag Properties

```typescript
{
  "flag-name": {
    "description": "Optional description",
    "enabled": boolean,
    "rolloutPercentage": 0-100,  // Optional
    "allowedUsers": ["email"],    // Optional
    "metadata": {}                 // Optional
  }
}
```

## Rollout Examples

**Testing with team:**

```json
{
  "enabled": true,
  "allowedUsers": ["team@glean.com"]
}
```

**25% rollout:**

```json
{
  "enabled": true,
  "rolloutPercentage": 25
}
```

**Kill switch:**

```json
{
  "enabled": false
}
```

**Using metadata for configuration values:**

```json
{
  "enabled": true,
  "metadata": {
    "version": "1.0.0-beta.1",
    "apiUrl": "https://api.example.com",
    "maxRetries": 3
  }
}
```

The `metadata` field can store arbitrary configuration values that can be accessed in components:

```typescript
const { flagConfigs } = useContext(FeatureFlagsContext);
const version = flagConfigs['mcp-cli-version']?.metadata?.version as string | undefined;
```

## Debug Mode

With `FLAGS_DEBUG=true`:

- Check console for active flags
- Override via URL: `?ff_my-feature-flag=true&ff_my-other-feature-flag=true`
- Access `window.__FLAGS_DEBUG__`

## How Percentage Rollouts Work

Our rollout system uses **deterministic bucketing** to ensure users get a consistent experience:

### The Bucketing Logic

1. **User Identity**: We identify users by (in order of preference):
   - Email address (if logged in)
   - User ID (if available)
   - Visitor ID (anonymous, stored in localStorage)

2. **Hash Calculation**: For each flag, we create a hash from `flag-name:user-identity`
   - This produces a number between 0-99
   - The same user always gets the same number for the same flag
   - Different flags produce different numbers for the same user

3. **Rollout Decision**: 
   - If `rolloutPercentage: 25`, users with hash 0-24 see the feature
   - If `rolloutPercentage: 50`, users with hash 0-49 see the feature
   - This ensures a stable, random distribution

### Why This Matters

- **Consistent Experience**: A user won't see features flickering on/off between page loads
- **True Randomization**: Users are distributed evenly across different features
- **Cross-Device**: If using email/userID, the same user gets the same experience on all devices
- **Anonymous Support**: Works even for logged-out users via persistent visitor ID

### Example Scenarios

**User "alice@glean.com" with two flags:**
```
Flag "new-search" (50% rollout): 
  Hash("new-search:alice@glean.com") = 23 → ENABLED ✓

Flag "beta-ui" (30% rollout):
  Hash("beta-ui:alice@glean.com") = 67 → DISABLED ✗
```

Alice will always see "new-search" but never "beta-ui" unless the percentages change.

## Performance Notes

- Build-time flags: Zero runtime cost, best for SEO
- Runtime flags: ~5ms evaluation, cached aggressively
- Hash calculation: <1ms using fast non-cryptographic hash

## Common Patterns

### Gradual Rollout

1. Start: `allowedUsers: ["team@glean.com"]`
2. Expand: `rolloutPercentage: 10`
3. Increase: `rolloutPercentage: 50`
4. Launch: `enabled: true` (remove restrictions)

### A/B Test

```json
{
  "variant-a": { "enabled": true, "rolloutPercentage": 50 },
  "variant-b": { "enabled": true, "rolloutPercentage": 50 }
}
```

### Feature Deprecation

1. Add flag with `enabled: true`
2. Wrap old feature in `!isEnabled('new-feature')`
3. After migration, remove flag and old code

## Troubleshooting

**Flags not working at build:**

- Check env vars are exported
- Verify JSON syntax in `FEATURE_FLAGS_JSON`
- Look for flag evaluation in build logs

**Flags not updating at runtime:**

- Check `/api/feature-flags` response
- Verify `EDGE_CONFIG` is set in Vercel
- Clear localStorage to force refresh
- Check browser console with `FLAGS_DEBUG=true`
