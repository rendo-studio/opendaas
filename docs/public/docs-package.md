---
name: Docs Package
description: The recommended authored docs profile and the boundary between recommendation and runtime dependency.
---

# Docs Package

## Recommended Minimum

OpenDaaS recommends this minimal docs package profile:

```text
docs/
  shared/
    overview.md
    goal.md
  public/
  internal/
```

## What Each Section Means

`shared/`

- the two most stable project anchors
- what the project is
- where the project is going

`public/`

- external-facing authored docs
- what another developer needs in order to adopt and use the framework

`internal/`

- maintainer-facing authored docs
- implementation details, verification rules, and repository-specific notes

## Important Boundary

This profile is a recommendation and a default scaffold.

It is not a runtime requirement.

A repository may choose a different docs package shape as long as OpenDaaS references authored pages through explicit `docPath` values.

## What To Avoid

Do not assume:

- `docs/` must always be the docs root
- a specific subdirectory name implies a specific framework meaning
- the docs site should infer version or decision pages from a hardcoded path convention
