---
name: Workspace Model
description: The public model for how APCC separates authored docs from structured control-plane state.
---

# Workspace Model

## Two Surfaces

APCC is built around a strict separation between:

- `docs/` for authored context
- `.apcc/` for structured control-plane state

This separation is not cosmetic. It prevents prose, execution state, and runtime artifacts from drifting into one another.

## What Belongs In `docs/`

Put these in `docs/`:

- explanations
- guides
- constraints
- background
- maintainer notes
- external documentation

## What Belongs In `.apcc/`

Put these in `.apcc/`:

- project overview
- end goal
- plans
- tasks
- decisions
- project-level versions
- docs-site workspace config

## Derived State Rule

APCC should persist explicit facts, not computed caches.

That means progress and plan execution status are derived at read time instead of being stored as separate authoritative files.

## `docPath` Rule

Whenever structured state needs to point at authored documentation, it should do so explicitly with `docPath`.

Examples:

- project overview -> overview doc
- end goal -> goal doc
- decision record -> optional decision doc
- version record -> optional version doc

This keeps the framework neutral. The runtime should not infer meaning from fixed docs subdirectories.
