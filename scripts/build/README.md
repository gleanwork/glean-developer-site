# Build Cache System

## Overview

The build cache system dramatically reduces build times by intelligently caching multiple build phases: changelog generation, OpenAPI transformations, API documentation generation, and the final Docusaurus build output.

### Performance Improvements

- **Cold build** (no cache): ~8-10 minutes (baseline)
- **Warm build** (all cached): <1 minute (10x improvement)
- **Single API changed**: ~2-3 minutes (3x improvement)
- **Spec transform changed**: ~4-5 minutes (2x improvement)

## Architecture

The system uses a make-style dependency tracking approach with three caching phases:

### Phase 1: Pre-Build Generation Cache
- **Changelog**: Caches `src/data/changelog.json` and `static/changelog.xml`
- **OpenAPI Transforms**: Caches spec capitalization and splitting operations

### Phase 2: API Documentation Generation Cache
- **Per-API Caching**: Each of 19 APIs cached independently
- **Smart Invalidation**: Only regenerates when spec or generator changes
- **Overview Preservation**: Hand-written overview files never deleted

### Phase 3: Build Output Cache
- **Full Build Caching**: Caches entire `build/` directory
- **Comprehensive Hashing**: Tracks all build inputs (specs, docs, config, code)
- **Atomic Restoration**: All-or-nothing cache restore

## Directory Structure

```
.build-cache/
├── lockfile.json           # Central cache manifest
└── builds/
    └── docusaurus:build/   # Cached build output
```

### Lockfile Schema

```json
{
  "version": 1,
  "generated": "2025-11-10T10:30:00Z",
  "targets": {
    "changelog": {
      "inputs": {
        "entries": "sha256:abc...",
        "dataGenerator": "sha256:def...",
        "rssGenerator": "sha256:789..."
      },
      "outputs": [
        "src/data/changelog.json",
        "static/changelog.xml"
      ],
      "status": "valid",
      "lastBuilt": "2025-11-10T10:25:00Z"
    }
  }
}
```

## Usage

### Basic Commands

```bash
# Build with cache (default)
pnpm build

# Build with verbose logging
pnpm build:verbose

# Build without cache
pnpm build:nocache

# Legacy build (no cache system)
pnpm build:legacy

# Clear all cache
pnpm cache:clear

# View cache statistics
pnpm cache:stats

# Validate cache integrity
pnpm cache:validate
```

### Environment Variables

```bash
# Disable cache completely
DISABLE_BUILD_CACHE=true pnpm build

# Enable verbose logging
VERBOSE=true pnpm build
```

## How It Works

### Cache Key Calculation

Each target has inputs that determine its cache key:

#### Changelog
- All `changelog/entries/*.md` files
- `scripts/generate-changelog-data.mjs`
- `scripts/generate-rss-feed.mjs`

#### OpenAPI Transformations
- Source spec URL or file
- Transform scripts (capitalize, split)

#### OpenAPI Generation
- Transformed spec file
- `scripts/generator/customMdGenerators.ts`
- `docusaurus-plugin-openapi-docs` version
- `docusaurus.config.ts`

#### Full Build
- All of `openapi/` directory
- All of `docs/` directory
- All of `changelog/entries/` directory
- All of `src/` directory
- `docusaurus.config.ts`
- `sidebars.ts`
- `package.json`
- Docusaurus version

### Build Flow

```
1. Initialize cache system
   └─> Load lockfile.json

2. Build changelog (if needed)
   ├─> Calculate hash of inputs
   ├─> Compare with lockfile
   └─> Generate or use cache

3. Transform OpenAPI specs (if needed)
   ├─> Capitalize client spec
   ├─> Split into sub-APIs
   └─> Capitalize indexing spec

4. Generate API docs (if needed)
   ├─> For each API (19 total)
   ├─> Check if spec/generator changed
   ├─> Preserve overview files
   ├─> Generate or skip
   └─> Clean unwanted artifacts

5. Check build output cache
   ├─> Calculate hash of all inputs
   ├─> Compare with lockfile
   └─> Restore from cache OR build

6. Run Docusaurus build (if needed)
   └─> Standard Docusaurus build

7. Cache build output
   └─> Store build/ directory in cache
```

## Incremental Builds (Phase 3)

The system includes operation-level tracking for future incremental builds:

### Operation Tracking
- Parses OpenAPI specs to extract individual operations
- Calculates hash for each operation
- Detects added, removed, and changed operations

### Smart Invalidation
- Only rebuilds changed operations (when supported by plugin)
- Tracks operation dependencies
- Minimizes regeneration work

**Note**: Currently requires full API rebuild when any operation changes. True per-operation rebuilding requires plugin modifications.

## CI/CD Integration

### GitHub Actions

The cache is automatically restored in CI:

```yaml
- name: Restore build cache
  uses: actions/cache@v4
  with:
    path: .build-cache
    key: build-cache-v1-${{ runner.os }}-${{ hashFiles(...) }}
    restore-keys: |
      build-cache-v1-${{ runner.os }}-
```

This provides:
- Faster CI builds (5-10x speedup on cache hits)
- Reduced GitHub Actions minutes
- Consistent cache across branches

## Troubleshooting

### Cache Not Working

1. **Check if cache is disabled:**
   ```bash
   echo $DISABLE_BUILD_CACHE
   ```

2. **View cache statistics:**
   ```bash
   pnpm cache:stats
   ```

3. **Clear and rebuild:**
   ```bash
   pnpm cache:clear
   pnpm build
   ```

### Build Failures

1. **Try without cache:**
   ```bash
   pnpm build:nocache
   ```

2. **Check for corrupted cache:**
   ```bash
   pnpm cache:validate
   ```

3. **Use legacy build:**
   ```bash
   pnpm build:legacy
   ```

### Validation Errors

If `pnpm cache:validate` fails:

1. **Check lockfile integrity:**
   ```bash
   cat .build-cache/lockfile.json
   ```

2. **Verify generated files exist:**
   ```bash
   ls -la src/data/changelog.json
   ls -la static/changelog.xml
   ls -la docs/api/client-api/chat/
   ```

3. **Rebuild from scratch:**
   ```bash
   pnpm cache:clear
   pnpm build
   ```

### Slow Builds

If builds are still slow:

1. **Check cache hit rate:**
   ```bash
   pnpm build:verbose 2>&1 | grep "Cache hit"
   ```

2. **Monitor what's being rebuilt:**
   ```bash
   pnpm build:verbose
   ```

3. **Check for stale cache entries:**
   ```bash
   pnpm cache:stats
   ```

## Implementation Details

### File Structure

```
scripts/build/
├── build.mjs           # Main orchestrator
├── cache.mjs           # Core cache logic
├── hash.mjs            # Hashing utilities
├── changelog.mjs       # Changelog caching
├── openapi.mjs         # OpenAPI caching
├── incremental.mjs     # Incremental builds
├── validate.mjs        # Cache validation
└── README.md           # This file
```

### Key Classes

#### BuildCache
Core cache management:
- `shouldRebuild(target, inputs)` - Check if target needs rebuild
- `markBuilt(target, inputs, outputs)` - Update cache after build
- `storeBuildOutput(target, dir, inputs)` - Cache build directory
- `restoreBuildOutput(target, dir)` - Restore from cache

#### Hashing Utilities
- `hashFile(path)` - SHA256 of file content
- `hashDirectory(path, options)` - Recursive directory hash
- `hashPackageVersion(name)` - Package version hash
- `hashString(str)` - String hash

### Atomic Operations

All cache writes use atomic operations:
1. Write to temporary location
2. Verify write succeeded
3. Rename to final location (atomic on POSIX)
4. Update lockfile last

This ensures cache corruption is impossible.

## Development

### Adding New Cached Operations

To add a new cached operation:

1. **Define inputs** in the relevant module
2. **Calculate cache key** using hashing utilities
3. **Check cache** with `shouldRebuild()`
4. **Run operation** if needed
5. **Update cache** with `markBuilt()`

Example:

```javascript
export async function buildMyFeature(cache) {
  const target = 'my-feature';
  
  const inputs = {
    source: hashFile('path/to/source.txt'),
    config: hashFile('path/to/config.json')
  };
  
  if (cache.shouldRebuild(target, inputs)) {
    // Run the operation
    execSync('my-build-command');
    
    // Mark as built
    cache.markBuilt(target, inputs, ['output/file.txt']);
  }
}
```

### Testing

1. **Unit test cache logic:**
   ```bash
   # Test hash consistency
   node scripts/build/hash.mjs
   ```

2. **Test cache operations:**
   ```bash
   pnpm cache:clear
   pnpm build
   pnpm cache:stats
   pnpm build  # Should be faster
   ```

3. **Validate integrity:**
   ```bash
   pnpm cache:validate
   ```

## Best Practices

1. **Don't commit cache files** - `.build-cache/` is in `.gitignore`
2. **Clear cache after major changes** - Use `pnpm cache:clear`
3. **Monitor cache size** - Run `pnpm cache:stats` periodically
4. **Use verbose mode for debugging** - `pnpm build:verbose`
5. **Validate after changes** - `pnpm cache:validate`

## Rollback Strategy

To temporarily disable the cache:

```bash
DISABLE_BUILD_CACHE=true pnpm build
```

To permanently revert to old system:

```json
{
  "scripts": {
    "build": "pnpm build:legacy"
  }
}
```

## Support

For issues or questions:
1. Check this documentation
2. Run `pnpm cache:validate`
3. Check cache logs with `pnpm build:verbose`
4. Clear cache and try again: `pnpm cache:clear && pnpm build`

