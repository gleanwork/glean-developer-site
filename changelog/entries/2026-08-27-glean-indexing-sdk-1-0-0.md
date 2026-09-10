---
title: 'glean-indexing-sdk v1.0.0'
categories: ['Glean Indexing SDK']
---

Glean-indexing-sdk v1.0.0: **release**: exclude uv build sentinel from payload.

{/* truncate */}

## Changes

- **cli**: add test, schema, and completion commands.
- **cli**: add glean-idx run.
- **cli**: ship connector validation as glean-idx validate.
- **cli**: add the datasource command group.
- **cli**: add the document command group.
- **cli**: resolve connector projects and enforce preconditions.
- **cli**: add the glean-idx foundation and doctor command.
- Add configurable upload timeout to ConnectorOptions.
- **release**: exclude uv build sentinel from payload.
- **people**: preserve employee replacement compatibility.
- **deployment**: enforce exact connector secret access.
- **testing**: reject unbounded negative identity access.
- **connectors**: preserve incremental and empty full semantics.
- **cli**: honor deploy global options.
- **observability**: restore connector lifecycle parity.
- **release**: bind publish artifacts to tagged SHA.
- **deploy**: sanitize derived connector names.
- **deployment**: validate derived Kubernetes, GCP, and AWS resource names.
- **connectors**: preserve identity uploads and options.
- **gcp**: repair advertised cloud extra.
- **deploy**: make artifact generation non-destructive.
- **deploy**: synchronize container runtime IDs.
- **deploy**: accept valid AWS account IDs.
- **testing**: require explicit destructive opt-in for live runs.
- **testing**: reject unsafe live identity mutations.
- **testing**: reject live target changes after confirmation.
- **testing**: use current source data for live runs.
- **testing**: enforce the max-items contract.
- Support connector factories in deployed runners.
- Forward document_batch_size_bytes to all connector base classes.
- Bump js-yaml to 3.15.1 to resolve npm audit high-severity findings.
- **deployment**: strip https:// from OIDC issuer URL in AWS IRSA trust policy.
- **cli**: move deploy under glean-idx.
- Remove experimental worker module.

## Source

- [Release notes](https://github.com/gleanwork/glean-indexing-sdk/releases/tag/v1.0.0)
- [PR #200](https://github.com/gleanwork/glean-indexing-sdk/pull/200)
- [PR #198](https://github.com/gleanwork/glean-indexing-sdk/pull/198)
- [PR #197](https://github.com/gleanwork/glean-indexing-sdk/pull/197)
- [PR #196](https://github.com/gleanwork/glean-indexing-sdk/pull/196)
- [PR #195](https://github.com/gleanwork/glean-indexing-sdk/pull/195)
- [PR #189](https://github.com/gleanwork/glean-indexing-sdk/pull/189)
- [PR #192](https://github.com/gleanwork/glean-indexing-sdk/pull/192)
- [PR #184](https://github.com/gleanwork/glean-indexing-sdk/pull/184)
- [PR #188](https://github.com/gleanwork/glean-indexing-sdk/pull/188)
- [PR #182](https://github.com/gleanwork/glean-indexing-sdk/pull/182)
- [PR #185](https://github.com/gleanwork/glean-indexing-sdk/pull/185)
- [PR #186](https://github.com/gleanwork/glean-indexing-sdk/pull/186)
- [PR #187](https://github.com/gleanwork/glean-indexing-sdk/pull/187)
- [PR #177](https://github.com/gleanwork/glean-indexing-sdk/pull/177)
- [PR #176](https://github.com/gleanwork/glean-indexing-sdk/pull/176)
- [PR #172](https://github.com/gleanwork/glean-indexing-sdk/pull/172)
- [PR #175](https://github.com/gleanwork/glean-indexing-sdk/pull/175)
- [PR #174](https://github.com/gleanwork/glean-indexing-sdk/pull/174)
- [PR #171](https://github.com/gleanwork/glean-indexing-sdk/pull/171)
- [PR #173](https://github.com/gleanwork/glean-indexing-sdk/pull/173)
- [PR #169](https://github.com/gleanwork/glean-indexing-sdk/pull/169)
- [PR #150](https://github.com/gleanwork/glean-indexing-sdk/pull/150)
- [PR #147](https://github.com/gleanwork/glean-indexing-sdk/pull/147)
- [PR #132](https://github.com/gleanwork/glean-indexing-sdk/pull/132)
- [PR #131](https://github.com/gleanwork/glean-indexing-sdk/pull/131)
- [PR #130](https://github.com/gleanwork/glean-indexing-sdk/pull/130)
- [PR #127](https://github.com/gleanwork/glean-indexing-sdk/pull/127)
- [PR #126](https://github.com/gleanwork/glean-indexing-sdk/pull/126)
- [PR #124](https://github.com/gleanwork/glean-indexing-sdk/pull/124)
- [PR #123](https://github.com/gleanwork/glean-indexing-sdk/pull/123)
- [PR #19](https://github.com/gleanwork/glean-indexing-sdk/pull/19)
- [PR #134](https://github.com/gleanwork/glean-indexing-sdk/pull/134)
- [PR #125](https://github.com/gleanwork/glean-indexing-sdk/pull/125)
- [PR #52](https://github.com/gleanwork/glean-indexing-sdk/pull/52)
