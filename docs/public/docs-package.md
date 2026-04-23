---
name: Docs Package
description: The recommended authored docs profile and the boundary between recommendation and runtime dependency.
---

# Docs Package

## Recommended Minimum

APCC recommends this minimal docs package profile:

```text
docs/
  meta.json
  shared/
    overview.md
    goal.md
  public/
  internal/
```

This is the default English scaffold. If the repository's primary docs language is different, the shared anchor filenames may be localized while keeping the same structural roles.

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

`meta.json`

- root navigation order for the default docs-site experience
- the scaffolded example of how to make top-level docs ordering explicit
- not a business-meaning contract; just a navigation hint for the docs site

## Important Boundary

This profile is a recommendation and a default scaffold.

It is not a runtime requirement.

A repository may choose a different docs package shape as long as APCC references authored pages through explicit `docPath` values.

The scaffold includes `docs/meta.json` because top-level navigation order is part of the human-facing reading experience, and it gives development agents a concrete minimal example of docs-site navigation configuration.

## What To Avoid

Do not assume:

- `docs/` must always be the docs root
- a specific subdirectory name implies a specific framework meaning
- the docs site should infer version or decision pages from a hardcoded path convention
