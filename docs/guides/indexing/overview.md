---
title: Overview
---

The Glean Indexing API allows customers to put arbitrary content in the search index, making it available for Generative AI applications. This is particularly useful for performing permissions-aware searches over content in internal tools that reside on-premises, as well as for searching over applications that Glean does not currently support first class. Additionally, these APIs allow the customer to push organization data (people info, organization structure, etc.) into Glean.

In addition to documents, the Indexing API also supports indexing custom entities. These are structured key-value content, as opposed to being text heavy like documents. This feature is useful when the information is in the form of structured schema that can be represented as key-value type attributes.

Glean provides advance notice of any planned backwards incompatible changes along with a sunset period for anything that requires developers to adopt the new versions.