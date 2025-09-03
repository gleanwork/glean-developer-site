# Build Cache System

## Overview

The Glean Developer Site build cache system dramatically reduces build times by caching expensive generation operations (OpenAPI documentation and changelog) while maintaining **zero visible changes** to the website structure, URLs, or content.

### Key Benefits

- **80%+ faster builds** when cache is valid (from ~5-10 minutes to <1 minute)
- **Zero regressions** - website functions identically with or without cache
- **Transparent operation** - cache is invisible to end users
- **Graceful degradation** - builds continue even if cache fails

## Architecture

```tree
.build-cache/
├── manifest.json           # Cache metadata and hashes
├── openapi/
│   ├── client-{api}/       # Each client API cached separately
│   │   ├── spec.hash      # SHA256 of source OpenAPI spec
│   │   ├── generated/     # Cached generated files
│   │   └── metadata.json  # Generation metadata
│   ├── indexing/
│   │   ├── spec.hash
│   │   ├── generated/
│   │   └── metadata.json
└── changelog/
    ├── spec.hash          # SHA256 of all changelog entries
    ├── generated/         # Cached changelog.json and changelog.xml
    └── metadata.json
```

## Usage

### Basic Commands

```bash
# Regular build with cache (default)
yarn build

# Build without using cache
yarn build:nocache

# Fast build (skip OpenAPI generation)
yarn build:fast

# Clear all cache
yarn cache:clear

# Clear specific cache category
yarn cache:clear:openapi
yarn cache:clear:changelog

# View cache statistics
yarn cache:stats

# Validate cache correctness
yarn cache:validate

# Full validation (compares cached vs non-cached builds)
yarn cache:validate:full

# Rebuild cache from scratch
yarn cache:rebuild
```

### Environment Variables

```bash
# Disable cache completely
DISABLE_BUILD_CACHE=true yarn build

# Skip OpenAPI generation
GENERATE_API_DOCS=false yarn build
```

## How It Works

### Cache Key Calculation

The cache system uses SHA256 hashes to determine when content has changed:

#### OpenAPI Cache Keys
- Source OpenAPI specification content
- Generator version (from package.json dependencies)
- Generator configuration (customMdGenerators.ts)
- API name and sub-API name

#### Changelog Cache Keys
- All files in `changelog/entries/` directory
- Changelog generation script content
- RSS feed generation script content

### Build Process Flow

1. **Initialize Cache System**
   - Create `.build-cache` directory if needed
   - Load existing manifest

2. **Generate Changelog**
   - Calculate hash of changelog entries
   - Check if cache is valid
   - Use cache or regenerate as needed
   - Save to cache if regenerated

3. **Generate OpenAPI Documentation** (if enabled)
   - Fetch/load OpenAPI specifications
   - Calculate hash for each API
   - Check cache validity for each API
   - Use cache or regenerate as needed
   - Clean up unwanted artifacts
   - Preserve hand-written overview files

4. **Run Docusaurus Build**
   - Standard Docusaurus build process
   - Uses generated/cached files

### File Preservation

The cache system carefully preserves hand-written documentation:

**Client API Overview Files** (always preserved):
- `docs/api/client-api/*/overview.mdx`

**Indexing API Overview Files** (always preserved):
- `docs/api/indexing-api/*-overview.mdx`

**Build Artifacts** (always removed):
- `**/sidebar.ts`
- `**/*.info.mdx`
- `**/*.tag.mdx`

## CI/CD Integration

### GitHub Actions

The cache is automatically used in CI with the following configuration:

```yaml
- name: Cache build artifacts
  uses: actions/cache@v4
  with:
    path: .build-cache
    key: build-cache-${{ runner.os }}-${{ hashFiles('openapi/**/*.yaml', 'changelog/entries/**/*.md', 'package.json', 'scripts/**/*.mjs') }}
    restore-keys: |
      build-cache-${{ runner.os }}-
```

### Vercel

The cache works automatically with Vercel's build system. The `.build-cache` directory is preserved between builds when possible.

## Troubleshooting

### Cache Not Working

1. **Check if cache is disabled:**
   ```bash
   echo $DISABLE_BUILD_CACHE
   ```

2. **Verify cache directory exists:**
   ```bash
   ls -la .build-cache/
   ```

3. **View cache statistics:**
   ```bash
   yarn cache:stats
   ```

4. **Clear and rebuild cache:**
   ```bash
   yarn cache:clear
   yarn build
   ```

### Validation Failures

If `yarn cache:validate` fails:

1. **Check for missing files:**
   - Ensure all overview.mdx files exist
   - Verify generated API documentation is present

2. **Check for unwanted artifacts:**
   - Look for sidebar.ts files
   - Check for *.info.mdx or *.tag.mdx files

3. **Run full validation:**
   ```bash
   yarn cache:validate:full
   ```

### Performance Issues

If builds are still slow:

1. **Check cache hit rate:**
   ```bash
   yarn build 2>&1 | grep "Cache hit"
   ```

2. **Verify network connectivity:**
   - Cache may fall back to fetching specs from GitHub
   - Check network speed and availability

3. **Monitor cache size:**
   ```bash
   yarn cache:stats
   du -sh .build-cache/
   ```

## Development

### Adding New Cached Operations

To add a new cached operation:

1. Create a new cache class extending the pattern in `scripts/cache/`
2. Implement cache key calculation
3. Implement save/restore logic
4. Integrate with `build-with-cache.mjs`
5. Add validation rules to `validate-cache.mjs`

### Cache Versioning

The cache system includes version tracking:
- Cache format version in metadata.json
- Generator version tracking
- Automatic invalidation on version changes

### Testing Cache Correctness

```bash
# Run validation tests
yarn cache:validate

# Compare cached vs non-cached builds
yarn cache:validate:full

# Manual comparison
yarn cache:clear
yarn build
mv build build-nocache
yarn build
diff -r build build-nocache
```

## Best Practices

1. **Don't commit cache files** - `.build-cache/` is gitignored
2. **Clear cache after major changes** - Use `yarn cache:clear` after updating generators
3. **Monitor cache size** - Run `yarn cache:stats` periodically
4. **Validate after updates** - Run `yarn cache:validate` after modifying build scripts
5. **Use cache in CI** - Leverage GitHub Actions cache for faster CI builds

## Migration from Previous System

If migrating from a previous cache implementation:

1. Remove old cache files:
   ```bash
   rm -rf .changelog-cache.json
   rm -rf .openapi-cache/
   ```

2. Clear Docusaurus cache:
   ```bash
   yarn clear
   ```

3. Build with new cache system:
   ```bash
   yarn build
   ```

## Rollback Strategy

To disable the cache system and revert to original behavior:

1. **Temporary disable:**
   ```bash
   DISABLE_BUILD_CACHE=true yarn build
   ```

2. **Permanent disable:**
   ```bash
   # In package.json, change:
   "build": "node scripts/cache/build-with-cache.mjs"
   # To:
   "build": "yarn build:nocache"
   ```

3. **Complete removal:**
   ```bash
   rm -rf scripts/cache/
   rm -rf .build-cache/
   # Revert package.json changes
   ```

## Support

For issues or questions about the cache system:
1. Check this documentation
2. Run `yarn cache:validate` for diagnostics
3. Review cache logs in build output
4. Clear cache and rebuild if needed
