---
name: Decisions And Versions
description: When to use decision records and when to use project-level version records.
---

# Decisions And Versions

## Decisions

Use a decision record for a high-value choice that needs to remain visible later.

Typical examples:

- a goal change
- a scope change
- an architecture shift
- a breaking-change policy change
- a versioning policy change

Do not use decisions for ordinary task progress.

## Versions

Use a version record for a low-frequency, project-level milestone.

A version record is appropriate when the project has reached a new overall state that is worth preserving.

That does not require an external product release. It does require a meaningful maturity boundary.

## Relationship

Decisions and versions solve different problems.

- decisions explain why an important direction was chosen
- versions record when the project reached a new stable boundary

A version may reference supporting decisions, but it should not depend on the decision system to make sense.
