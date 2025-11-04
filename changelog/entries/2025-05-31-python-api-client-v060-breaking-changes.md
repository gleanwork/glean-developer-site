---
title: 'Python API Client v0.6.0 - Breaking Changes'
categories: ['SDK']
---

The Python API client now uses a namespaced package structure. All imports must be updated from `glean` to `glean.api_client`.

{/* truncate */}

### What Changed

- Import paths have changed from `from glean import ...` to `from glean.api_client import ...`
- This affects all classes including `Glean`, `models`, and other API components

### Migration Required

**Before:**

```python
from glean import Glean
from glean import models
from glean.models import Something
from glean.exceptions import ApiError
```

**After:**

```python
from glean.api_client import Glean
from glean.api_client import models
from glean.api_client.models import Something
from glean.api_client.exceptions import ApiError
```

### Automated Migration

Use [ast-grep](https://ast-grep.github.io/) (a structural search and replace tool) to automatically update your Python code:

```bash
# First, update imports from glean submodules (e.g., from glean.models import ...)
ast-grep --update-all \
  --pattern 'from glean.$SUBMODULE import $$REST' \
  --rewrite 'from glean.api_client.$SUBMODULE import $$REST' \
  --lang python \
  path/to/your/code

# Then, update basic glean imports (e.g., from glean import ...)
ast-grep --update-all \
  --pattern 'from glean import $$REST' \
  --rewrite 'from glean.api_client import $$REST' \
  --lang python \
  path/to/your/code

# Finally, fix any double-nesting that may have occurred
ast-grep --update-all \
  --pattern 'from glean.api_client.api_client import $$REST' \
  --rewrite 'from glean.api_client import $$REST' \
  --lang python \
  path/to/your/code
```

### Manual Steps

If you prefer to update manually, search for all instances of:

- `from glean import` → `from glean.api_client import`
- `from glean.` (but not glean.api_client) → `from glean.api_client.`

### Compatibility

- This change affects all Python API client users
- No functional changes to the API itself - only import paths
- Ensure you're using the latest version of the Python API client package
