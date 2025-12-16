---
title: "Deep Linked Citations Migration Guide"
categories: ["API", "Documentation"]
---

Added a migration guide for custom chat frontends to adopt deep-linked citations in the `/chat` API response.

{/* truncate */}

Deep-linked citations upgrade Glean Chat's citations from document-level to text-level—the response now includes exact quoted snippets from source documents via the new `referenceRanges[].snippets[]` field.

The guide covers:
- New response format and fields
- Minimal vs full migration paths
- Code examples (TypeScript/React)
- Fetching document content for contextual previews

The change is additive and backward compatible—no action required unless you want to render the richer citation experience.

Visit the [Deep Linked Citations guide](/docs/guides/chat/deep-linked-citations) for more information.
